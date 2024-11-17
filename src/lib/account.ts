import { EmailAddress, EmailMessage, SyncResponse, SyncUpdatedResponse } from "@/types";
import axios from "axios";
import { syncEmailsToDatabase } from './sync-to-db';
import { db } from "@/server/db";


const API_BASE_URL = 'https://api.aurinko.io/v1';

export class Account {
    private token: string;

    constructor(token: string){
        this.token = token
    }

    private async startSync(){
        const response = await axios.post<SyncResponse>('https://api.aurinko.io/v1/email/sync', {}, {
            headers:{
                Authorization: `Bearer ${this.token}`
            },
            params:{
                daysWithin:2,
                bodyType: 'html'
            }
        })
        return response.data
    }

    async getUpdatedEmails({deltaToken, pageToken}:{deltaToken?:string, pageToken?:string}){
        let params: Record<string, string>={}
        if(deltaToken) params.deltaToken = deltaToken
        if(pageToken) params.pageToken = pageToken

        const response = await axios.get<SyncUpdatedResponse>('https://api.aurinko.io/v1/email/sync/updated', {
            headers:{
                Authorization: `Bearer ${this.token}`
            },
            params
        })
        return response.data
    }

    async performInitialSync(){
        try {
            let syncResponse = await this.startSync()
            while(!syncResponse.ready){
                await new Promise(resolve => setTimeout(resolve, 1000))
                syncResponse = await this.startSync()
            }

            let storedDeltaToken: string = syncResponse.syncUpdatedToken

            let updateResponse = await this.getUpdatedEmails({deltaToken: storedDeltaToken})

            if(updateResponse.nextDeltaToken){
                storedDeltaToken = updateResponse.nextDeltaToken
            }

            let allEmails: EmailMessage[] = updateResponse.records

            while(updateResponse.nextPageToken){
                updateResponse = await this.getUpdatedEmails({ pageToken: updateResponse.nextPageToken })
                allEmails = allEmails.concat(updateResponse.records)
                if(updateResponse.nextDeltaToken){
                    storedDeltaToken = updateResponse.nextDeltaToken
                }
            }

            console.log("initial sync completed, we have synced", allEmails.length, 'emails')

            // await this.getUpdatedEmails({ deltaToken: storedDeltaToken })

            return{
                emails: allEmails,
                deltaToken: storedDeltaToken
            }

        } catch (error) {
            if(axios.isAxiosError(error)){
                console.error("Error during sync: ", JSON.stringify(error.response?.data, null, 2))
            }else{
                console.error("Error during sync: ", error)
            }
        }
    }

    async sendEmail({
        from,
        subject,
        body,
        inReplyTo,
        references,
        threadId,
        to,
        cc,
        bcc,
        replyTo,
    }: {
        from: EmailAddress;
        subject: string;
        body: string;
        inReplyTo?: string;
        references?: string;
        threadId?: string;
        to: EmailAddress[];
        cc?: EmailAddress[];
        bcc?: EmailAddress[];
        replyTo?: EmailAddress;
    }) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/email/messages`,
                {
                    from,
                    subject,
                    body,
                    inReplyTo,
                    references,
                    threadId,
                    to,
                    cc,
                    bcc,
                    replyTo: [replyTo],
                },
                {
                    params: {
                        returnIds: true
                    },
                    headers: { Authorization: `Bearer ${this.token}` }
                }
            );

            console.log('sendmail', response.data)
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error sending email:', JSON.stringify(error.response?.data, null, 2));
            } else {
                console.error('Error sending email:', error);
            }
            throw error;
        }
    }
    async syncEmails() {
        const account = await db.account.findUnique({
            where: {
                accessToken: this.token
            },
        })
        if (!account) throw new Error("Invalid token")
        if (!account.nextDeltaToken) throw new Error("No delta token")
        let response = await this.getUpdatedEmails({ deltaToken: account.nextDeltaToken })
        let allEmails: EmailMessage[] = response.records
        let storedDeltaToken = account.nextDeltaToken
        if (response.nextDeltaToken) {
            storedDeltaToken = response.nextDeltaToken
        }
        while (response.nextPageToken) {
            response = await this.getUpdatedEmails({ pageToken: response.nextPageToken });
            allEmails = allEmails.concat(response.records);
            if (response.nextDeltaToken) {
                storedDeltaToken = response.nextDeltaToken
            }
        }

        if (!response) throw new Error("Failed to sync emails")


        try {
            await syncEmailsToDatabase(allEmails, account.id)
        } catch (error) {
            console.log('error', error)
        }

        // console.log('syncEmails', response)
        await db.account.update({
            where: {
                id: account.id,
            },
            data: {
                nextDeltaToken: storedDeltaToken,
            }
        })
    }

}