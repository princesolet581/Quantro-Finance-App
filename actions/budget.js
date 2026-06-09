"use server";

import { db } from "@/lib/prisma";
import {
    calculateBudgetUsage,
    getBudgetMonthRange,
    summarizeBudgetPlan,
} from "@/lib/budget-planning.mjs";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { _success } from "zod/v4/core";

export async function getCurrentBudget(accountId) { 

    try {

        const {userId}  =  await auth()
                       if (!userId)throw new Error("Unauthorized")
           
                           const user  =  await db.user.findUnique({
                       where :{clerkUserId :userId}
                       });
           
                       if(!user){
                           throw new Error("User not find")
                       }


                       const budget  = await db.budget.findFirst({
                        where:{
                            userId: user.id,
                        },
                       });

                       const currentDate  =  new Date();

                       const startOfMonth = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),

                        1
                       );


                       const endOfMonth = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth()+1,

                        0
                       );  


                       const expenses  =  await db.transaction.aggregate({
                        where:{
                            userId: user.id,
                            type:"EXPENSE",
                            date:{
                                gte:startOfMonth,
                                lte:endOfMonth

                            },


                            accountId,
                        },
                        _sum :{
                            amount : true,
                        },


                       });


                       return {
                        budget:budget?{...budget, amount:budget.amount.toNumber()}: null,
                        currentExpenses:expenses._sum.amount

                        ?
                        expenses._sum.amount.toNumber()
                        :0,

                       } 
            



        
    } catch (error) {

        console.log("Error fetching budget:",error);
        throw error
        
        
    }
    
}


export async function updateBudget(amount){
    try {


               const {userId}  =  await auth()
                       if (!userId)throw new Error("Unauthorized")
           
                           const user  =  await db.user.findUnique({
                       where :{clerkUserId :userId}
                       });
           
                       if(!user){
                           throw new Error("User not find")
                       }


                       const budget  =  await db.budget.upsert({
                        where :{
                            userId:user.id,
                        },
                        update:{
                            amount,
                        },
                        create:{
                            userId: user.id,
                            amount,
                        },
                       });


                       revalidatePath("/dashboard")
                       return {
                        success: true,
                        data:{
                            ...budget,
                            amount:budget.amount.toNumber()
                        }
                       }
        
    } catch (error) {
        console.log("Error updating budget:",error);
        return {
            success:false,
            error: error.message 
        }
        
    }
}

async function getAuthenticatedUser() {
    const {userId} = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: {clerkUserId: userId},
    });

    if (!user) {
        throw new Error("User not find");
    }

    return user;
}

export async function getMonthlyBudgetPlan(monthDate = new Date()) {
    const user = await getAuthenticatedUser();
    const {month, start, end} = getBudgetMonthRange(new Date(monthDate));

    const [budgets, expenses] = await Promise.all([
        db.monthlyBudget.findMany({
            where: {
                userId: user.id,
                month,
            },
            orderBy: {
                category: "asc",
            },
        }),
        db.transaction.groupBy({
            by: ["category"],
            where: {
                userId: user.id,
                type: "EXPENSE",
                date: {
                    gte: start,
                    lt: end,
                },
            },
            _sum: {
                amount: true,
            },
        }),
    ]);

    const spentByCategory = new Map(
        expenses.map((expense) => [
            expense.category,
            expense._sum.amount?.toNumber() || 0,
        ])
    );

    const items = budgets.map((budget) => {
        const usage = calculateBudgetUsage(
            {amount: budget.amount.toNumber()},
            spentByCategory.get(budget.category) || 0
        );

        return {
            id: budget.id,
            category: budget.category,
            amount: usage.amount,
            spent: usage.spent,
            remaining: usage.remaining,
            percentUsed: usage.percentUsed,
            status: usage.status,
            rollover: budget.rollover,
            alertThreshold: budget.alertThreshold,
        };
    });

    return {
        month: month.toISOString(),
        items,
        summary: summarizeBudgetPlan(items),
    };
}

export async function upsertMonthlyBudget(data) {
    try {
        const user = await getAuthenticatedUser();
        const {month} = getBudgetMonthRange(data.month ? new Date(data.month) : new Date());
        const amount = Number.parseFloat(data.amount);
        const alertThreshold = Number.parseInt(data.alertThreshold || 80, 10);

        if (!data.category) throw new Error("Category is required");
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error("Budget amount must be greater than zero");
        }
        if (!Number.isInteger(alertThreshold) || alertThreshold < 1 || alertThreshold > 100) {
            throw new Error("Alert threshold must be between 1 and 100");
        }

        const budget = await db.monthlyBudget.upsert({
            where: {
                userId_month_category: {
                    userId: user.id,
                    month,
                    category: data.category,
                },
            },
            update: {
                amount,
                rollover: Boolean(data.rollover),
                alertThreshold,
            },
            create: {
                userId: user.id,
                month,
                category: data.category,
                amount,
                rollover: Boolean(data.rollover),
                alertThreshold,
            },
        });

        revalidatePath("/dashboard");

        return {
            success: true,
            data: {
                ...budget,
                amount: budget.amount.toNumber(),
                spent: budget.spent.toNumber(),
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}

export async function deleteMonthlyBudget(id) {
    try {
        const user = await getAuthenticatedUser();

        await db.monthlyBudget.deleteMany({
            where: {
                id,
                userId: user.id,
            },
        });

        revalidatePath("/dashboard");

        return {success: true};
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
