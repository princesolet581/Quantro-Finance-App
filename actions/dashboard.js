"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";


import { revalidatePath } from "next/cache";
const serializeTransaction = (obj) => {
  const serialized = { ...obj };


  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized; // ✅ this was missing
};
export async function createAccount(data) {
    try {
        const {userId}  =  await auth()


        if (!userId)throw new Error("Unauthorized")



            const user  =  await db.user.findUnique({


        where :{clerkUserId :userId}
        });
        if(!user){
            throw new Error("User not find")
        }

        // convert balance to float before saving 

        const balanceFloat =  parseFloat(data.balance)
        if (isNaN(balanceFloat)){
            throw new Error ("Invalid balance amount")
        }

        //check if this is user's first account 
        const existingAccounts  =  await db.account.findMany({
            where :{
                userId:user.id
            },
        })

     const shouldBeDefault = existingAccounts.length===0?true:data.isDefault;


// if the account should be default ,unset other default accounts
     if(shouldBeDefault){
        await db.account.updateMany({
            where :{
                userId:user.id,
                isDefault:true
            },
            data :{
                isDefault:false,
            }
        })
     }


     const account = await  db.account.create({
        data:{
            ...data ,
            balance:balanceFloat,
            userId:user.id,
            isDefault:shouldBeDefault,
        }
     })
      const serializedAccont = serializeTransaction(account);
      revalidatePath("/dashboard")


      return {success: true , data :serializedAccont}
    } catch (error) {
        throw new Error(error.message)
    }
    
}


export async function getUserAccounts() {
  const {userId}  =  await auth()
        if (!userId)throw new Error("Unauthorized")


            const user  =  await db.user.findUnique({
        where :{clerkUserId :userId}
        });


        if(!user){
            throw new Error("User not find")
        }
     const accounts  =  await db.account.findMany({
        where:{
            userId: user.id
        },
        orderBy:{
            createdAt :"desc"
        },
        include :{
            _count :{
                select:{
                    transactions :true,

                },
            },
        },
     });

     
          const serializedAccont = accounts.map(serializeTransaction);
          return serializedAccont;

}

export async function getDashboardData() {
   const {userId}  =  await auth()


        if (!userId)throw new Error("Unauthorized")



            const user  =  await db.user.findUnique({


        where :{clerkUserId :userId}
        });
        if(!user){
            throw new Error("User not find")
        } 

        // Get all user transaction
        const transactions =  await db.transaction.findMany({
            where:{
                userId:user.id
            },
            orderBy:{
                date:"desc"
            }
        })
    return transactions.map(serializeTransaction)
}