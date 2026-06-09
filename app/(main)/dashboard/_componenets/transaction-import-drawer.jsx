"use client"

import React, { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { importTransactionsFromCsv } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";

const TransactionImportDrawer = ({ accounts }) => {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState(
    accounts.find((account) => account.isDefault)?.id || accounts[0]?.id || ""
  );
  const [file, setFile] = useState(null);

  const { loading, fn: importTransactions } = useFetch(importTransactionsFromCsv);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!accountId) {
      toast.error("Select an account before importing");
      return;
    }

    if (!file) {
      toast.error("Choose a CSV file to import");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Only CSV files are supported");
      return;
    }

    const csvText = await file.text();
    const result = await importTransactions(accountId, csvText);

    if (!result?.success) return;

    const { imported, skipped, errors } = result.data;
    toast.success(
      `Imported ${imported} transaction${imported === 1 ? "" : "s"}`
    );

    if (skipped > 0 || errors.length > 0) {
      toast.message(
        `${skipped} duplicate${skipped === 1 ? "" : "s"} skipped, ${errors.length} row error${errors.length === 1 ? "" : "s"}`
      );
    }

    setFile(null);
    event.currentTarget.reset();
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" disabled={!accounts.length}>
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Import Transactions</DrawerTitle>
        </DrawerHeader>
        <form className="space-y-4 px-4 pb-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Account</label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CSV File</label>
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            Required columns: date, description, amount. Use negative amounts
            for expenses, or provide debit and credit columns instead. Optional
            columns: type, category, id, source.
          </div>

          <div className="flex gap-4 pt-2">
            <DrawerClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                Cancel
              </Button>
            </DrawerClose>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionImportDrawer;
