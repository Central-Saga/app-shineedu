"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";
import { Enrollment } from "@/modules/enrollment/domain/entities";

const formSchema = z.object({
  status: z.enum(["UNPAID", "PAID", "WAIVED"]),
  due_date: z.string().optional(),
});

interface UpdateFeeStatusDialogProps {
  enrollment: Enrollment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function UpdateFeeStatusDialog({
  enrollment,
  open,
  onOpenChange,
  trigger,
}: UpdateFeeStatusDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: enrollment.biaya_pendaftaran_status || "UNPAID",
      due_date: enrollment.biaya_pendaftaran_due_date || "",
    },
  });

  const status = form.watch("status");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      await enrollmentRepository.updateRegistrationFeeStatus(enrollment.id, {
        status: values.status,
        due_date: values.due_date || undefined,
      });
      toast.success("Status biaya pendaftaran berhasil diperbarui");
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui status");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Status Biaya Pendaftaran</DialogTitle>
          <DialogDescription>
            Ubah status pembayaran biaya pendaftaran untuk murid ini.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Pembayaran</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="UNPAID">Belum Lunas (UNPAID)</SelectItem>
                      <SelectItem value="PAID">Lunas (PAID)</SelectItem>
                      <SelectItem value="WAIVED">Dibebaskan (WAIVED)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tampilkan Due Date jika UNPAID (optional) atau jika user ingin set tenggat */}
            {status === "UNPAID" && (
                <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tenggat Pembayaran (Optional)</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
