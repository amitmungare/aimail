import { db } from "./server/db";


await db.user.create({
    data: {
        emailAddress:'amit@gmail.com',
        firstName:'amit',
        lastName:'mungare'
    }
})