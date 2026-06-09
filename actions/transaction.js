"use server";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import {
    buildImportDuplicateKey,
    parseTransactionCsv,
} from "@/lib/transaction-import.mjs";
import { calculateNextRecurringDate } from "@/lib/recurring-transactions.mjs";
import {
    buildAuditEvent,
    buildImportBatchRecord,
} from "@/lib/audit-log.mjs";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";



const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const serializeAmount = (obj)=>({
    ...obj,
    amount: obj.amount.toNumber(),

})
export async function createTransaction(data) {
    try {
        const {userId}  =  await auth()
                if (!userId)throw new Error("Unauthorized")


                    // get request data for arcjet

                    const req =  await request();
                    // check rate limit 

                    const decision = await aj.protect(req,{
                        userId,
                        requested:1 //specify how many tokens to consume 
                    })

                    if (decision.isDenied()){
                        if (decision.reason.isRateLimit()){
                            const {remaining ,reset } =  decision.reason;
                            console.error({
                                code :"RATE_LIMIT_EXCEEDED",
                                details:{
                                    remaining,
                                    resetInSeconds:reset,

                                },
                            });

                            throw new Error("Too many requests. Please try again later.")
                        }

                         
                        throw new Error("Request Blocked")
                    }



        
        
                    const user  =  await db.user.findUnique({
                where :{clerkUserId :userId}
                });
        
        
                if(!user){
                    throw new Error("User not find")
                }

                const account  =  await db.account.findUnique({
                    where :{
                        id: data.accountId,
                        userId:user.id,

                    },
                });

                if(!account){
                    throw new Error("Account not found")
                }


                const balanceChange   =  data.type === "EXPENSE" ?  -data.amount :data.amount;
                const newBalance = account.balance.toNumber() + balanceChange;

                const transaction =  await db.$transaction(async(tx)=>{
                    const newTransaction =  await tx.transaction.create({
                        data:{
                            ...data,
                            userId: user.id,
                            nextRecurringDate: data.isRecurring
                             && data.recurringInterval?
                             calculateNextRecurringDate(data.date,data.recurringInterval):null,
                        }
                    })

                    await tx.account.update({
                        where:{
                            id:data.accountId
                        },
                        data:{
                            balance:newBalance
                        }
                    })
                    return newTransaction
                })

                revalidatePath("/dashboard");
                revalidatePath(`/account/${transaction.accountId}`)

                return {
                    success : true,
                    data:serializeAmount(transaction)
                }
    } catch (error) {

        throw new Error (error.message);
        
    }
    
}


export async function scanReceipt(file) {
try {
    const model  = genAI.getGenerativeModel({model:"gemini-1.5-flash"})

    //Convert file to ArrayBuffer
  const arrayBuffer =  await file.arrayBuffer();

    //Convert ArrayBuffer to Base64
     const base64String =  Buffer.from(arrayBuffer).toString("base64")


     const prompt=`Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object`;



    const result  =  await model.generateContent([
        {
            inlineData:{
                data:base64String,
                mimeType:file.type,
            },
        },
        prompt,

    ])

    const response = await result.response;
    const text = response.text()
    const cleanedText =  text.replace(/```(?:json)?\n?/g,"").trim();

    try {
        
        const data =JSON.parse(cleanedText);
        return {
            amount:parseFloat(data.amount),
            date:new Date(data.date),
            description:data.description,
            category:data.category,
            merchantName : data.merchantName,
        }
    } catch (parseError) {
        console.error("Error parsing JSON response:",parseError)
        throw new Error("Invalid response format from Gemini")
        
    }
} 

catch (error) {


    console.error("Error scanning receipt :", error.message)
    throw new Error("Failed to scan receipt")

    
}
    
}

export async function getTransaction(id){
     const {userId}  =  await auth()


        if (!userId)throw new Error("Unauthorized")



            const user  =  await db.user.findUnique({


        where :{clerkUserId :userId}
        });
        if(!user){
            throw new Error("User not find")
        }

        const transaction =  await db.transaction.findUnique({
            where:{
                id,
                userId:user.id,
            } 
        })

        if (!transaction) throw new Error ("Transaction not found")
            return serializeAmount(transaction)

}


export async function updateTransaction(id,data){
    try {
        const {userId}  =  await auth()


        if (!userId)throw new Error("Unauthorized")



            const user  =  await db.user.findUnique({


        where :{clerkUserId :userId}
        });
        if(!user){
            throw new Error("User not find")
        }

        //get original transaction to calculate balance change

        const originalTransaction =  await db.transaction.findUnique({
            where :{
                id,
                userId: user.id,
            },
            include:{
                account : true,
            } 
        })
          if (!originalTransaction) throw new Error ("Transation not found")
            // Calculate balance changes

          const oldBalanceChange =
          originalTransaction.type  === "EXPENSE"
          ? -originalTransaction.amount.toNumber()
          :originalTransaction.amount.toNumber()


          const newBalanceChange = 
          data.type === "EXPENSE"? -data.amount :data.amount;

          const netBalanceChange  = newBalanceChange - oldBalanceChange;

          //Update transaction and amount balance in a transaction
          const transaction =  await db.$transaction(async (tx) =>{
            const updated  =  await tx.transaction.update({
                where :{
                    id,
                    userId:user.id,
                },
                data:{
                    ...data,
                    nextRecurringDate:
                    data.isRecurring && data.recurringInterval
                    ?calculateNextRecurringDate(data.date,data.recurringInterval)
                    :null,
                }
            })

            //Update account balance 

            await tx.account.update({
                where :{
                    id:data.accountId
                },
                data:{
                    balance:{
                        increment :netBalanceChange, 
                        
                    }
                }
            })
            return updated;
          });

          revalidatePath("/dashboard");
          revalidatePath(`/account/${data.accountId}`);
          return {
            success: true ,
            data:serializeAmount(transaction)
          }
    } catch (error) {
        throw new Error(error.message)
    }
}

export async function importTransactionsFromCsv(accountId, csvText) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        if (!accountId) throw new Error("Account is required");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not find");
        }

        const account = await db.account.findUnique({
            where: {
                id: accountId,
                userId: user.id,
            },
        });

        if (!account) {
            throw new Error("Account not found");
        }

        const { transactions, errors } = parseTransactionCsv(csvText);
        const importId = randomUUID();

        const existingTransactions = await db.transaction.findMany({
            where: {
                accountId,
                userId: user.id,
                importSource: {
                    not: null,
                },
            },
            select: {
                type: true,
                amount: true,
                description: true,
                date: true,
                importSource: true,
            },
        });

        const duplicateKeys = new Set(
            existingTransactions.map((transaction) =>
                buildImportDuplicateKey({
                    ...transaction,
                    amount: transaction.amount.toNumber(),
                    description: transaction.description || "",
                })
            )
        );

        const newTransactions = [];
        const seenInFile = new Set();
        let skipped = 0;

        for (const transaction of transactions) {
            const duplicateKey = buildImportDuplicateKey(transaction);

            if (duplicateKeys.has(duplicateKey) || seenInFile.has(duplicateKey)) {
                skipped += 1;
                continue;
            }

            seenInFile.add(duplicateKey);
            newTransactions.push(transaction);
        }

        if (newTransactions.length === 0) {
            await db.$transaction(async (tx) => {
                await tx.importBatch.create({
                    data: buildImportBatchRecord({
                        source: "csv",
                        imported: 0,
                        skipped,
                        failed: errors.length,
                        userId: user.id,
                        accountId,
                    }),
                });

                await tx.auditEvent.create({
                    data: buildAuditEvent("imported", "transaction", {
                        userId: user.id,
                        entityId: importId,
                        metadata: {
                            imported: 0,
                            skipped,
                            failed: errors.length,
                            accountId,
                        },
                    }),
                });
            });

            return {
                success: true,
                data: {
                    imported: 0,
                    skipped,
                    errors,
                },
            };
        }

        const balanceChange = newTransactions.reduce((total, transaction) => {
            return total + (transaction.type === "EXPENSE" ? -transaction.amount : transaction.amount);
        }, 0);

        await db.$transaction(async (tx) => {
            await tx.transaction.createMany({
                data: newTransactions.map((transaction) => ({
                    ...transaction,
                    accountId,
                    userId: user.id,
                    importId,
                    importedAt: new Date(),
                    status: "COMPLETED",
                })),
            });

            await tx.importBatch.create({
                data: buildImportBatchRecord({
                    source: "csv",
                    imported: newTransactions.length,
                    skipped,
                    failed: errors.length,
                    userId: user.id,
                    accountId,
                }),
            });

            await tx.auditEvent.create({
                data: buildAuditEvent("imported", "transaction", {
                    userId: user.id,
                    entityId: importId,
                    metadata: {
                        imported: newTransactions.length,
                        skipped,
                        failed: errors.length,
                        accountId,
                    },
                }),
            });

            await tx.account.update({
                where: {
                    id: accountId,
                },
                data: {
                    balance: {
                        increment: balanceChange,
                    },
                },
            });
        });

        revalidatePath("/dashboard");
        revalidatePath(`/account/${accountId}`);

        return {
            success: true,
            data: {
                imported: newTransactions.length,
                skipped,
                errors,
            },
        };
    } catch (error) {
        throw new Error(error.message);
    }
}
