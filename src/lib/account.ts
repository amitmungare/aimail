import { EmailMessage, SyncResponse, SyncUpdatedResponse } from "@/types";
import axios from "axios";

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
}