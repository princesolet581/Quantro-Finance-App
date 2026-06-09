"use client"

import React, { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteMonthlyBudget,
  upsertMonthlyBudget,
} from "@/actions/budget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { defaultCategories } from "@/data/category";
import useFetch from "@/hooks/use-fetch";

const expenseCategories = defaultCategories.filter(
  (category) => category.type === "EXPENSE"
);

const MonthlyBudgetPlanner = ({ plan }) => {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("80");
  const [rollover, setRollover] = useState(false);

  const { loading: saveLoading, fn: saveBudget } = useFetch(upsertMonthlyBudget);
  const { loading: deleteLoading, fn: removeBudget } = useFetch(deleteMonthlyBudget);

  const plannedCategories = useMemo(
    () => new Set(plan.items.map((item) => item.category)),
    [plan.items]
  );

  const availableCategories = expenseCategories.filter(
    (item) => !plannedCategories.has(item.id) || item.id === category
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = await saveBudget({
      category,
      amount,
      alertThreshold,
      rollover,
      month: plan.month,
    });

    if (result?.success) {
      toast.success("Monthly budget saved");
      setCategory("");
      setAmount("");
      setAlertThreshold("80");
      setRollover(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await removeBudget(id);
    if (result?.success) {
      toast.success("Monthly budget removed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Budget Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Summary label="Budgeted" value={plan.summary.budgeted} />
          <Summary label="Spent" value={plan.summary.spent} />
          <Summary label="Remaining" value={plan.summary.remaining} />
          <Summary label="Alerts" value={plan.summary.alerts} plain />
        </div>

        <form className="grid gap-3 md:grid-cols-[1.3fr_1fr_.8fr_auto_auto] md:items-end" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Alert %</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={alertThreshold}
              onChange={(event) => setAlertThreshold(event.target.value)}
            />
          </div>
          <label className="flex h-10 items-center gap-2 text-sm">
            <Switch checked={rollover} onCheckedChange={setRollover} />
            Rollover
          </label>
          <Button type="submit" disabled={saveLoading || !category || !amount}>
            {saveLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Save
          </Button>
        </form>

        <div className="space-y-3">
          {plan.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No category budgets set for this month.
            </p>
          ) : (
            plan.items.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium capitalize">
                        {item.category.replace(/-/g, " ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${item.spent.toFixed(2)} / ${item.amount.toFixed(2)}
                      </p>
                    </div>
                    <Progress value={Math.min(item.percentUsed, 100)} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      ${item.remaining.toFixed(2)} remaining · alert at{" "}
                      {item.alertThreshold}%{item.rollover ? " · rollover" : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={deleteLoading}
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Summary = ({ label, value, plain = false }) => (
  <div className="rounded-lg border p-3">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-xl font-semibold">
      {plain ? value : `$${Number(value).toFixed(2)}`}
    </p>
  </div>
);

export default MonthlyBudgetPlanner;
