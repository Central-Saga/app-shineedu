"use client";

import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse, isValid } from "date-fns";

export function InlineCreateMurid() {
  const { control } = useFormContext(); 

  return (
    <div className="space-y-4 border rounded-md p-4 bg-muted/20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nama Lengkap */}
        <FormField
            control={control}
            name="murid_baru.nama_lengkap"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Nama Lengkap <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                <Input placeholder="Nama Murid" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        {/* Kode Murid (Optional/Auto) -> Usually hidden or auto in simple form, but lets keep it minimal */}
        
        {/* Jenis Kelamin */}
        <FormField
            control={control}
            name="murid_baru.jenis_kelamin"
            render={({ field }) => (
            <FormItem className="space-y-3">
                <FormLabel>Jenis Kelamin</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="L" id="ik-l" />
                      <Label htmlFor="ik-l" className="font-normal cursor-pointer">Laki-laki</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="P" id="ik-p" />
                      <Label htmlFor="ik-p" className="font-normal cursor-pointer">Perempuan</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />



         {/* Tanggal Lahir */}
         <FormField
            control={control}
            name="murid_baru.tanggal_lahir"
            render={({ field }) => (
            <FormItem className="flex flex-col mt-[7px]">
                <FormLabel className="mb-[6px]">Tanggal Lahir</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value && isValid(parse(field.value, "yyyy-MM-dd", new Date())) ? parse(field.value, "yyyy-MM-dd", new Date()) : null}
                    setDate={(date) => {
                      const formatted = date ? format(date, "yyyy-MM-dd") : null;
                      field.onChange(formatted);
                    }}
                    placeholder="Pilih tanggal lahir"
                  />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        {/* No HP */}
        <FormField
            control={control}
            name="murid_baru.no_hp"
            render={({ field }) => (
            <FormItem>
                <FormLabel>No. HP (WhatsApp)</FormLabel>
                <FormControl>
                <Input placeholder="08..." {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

         {/* Alamat (Full Width) */}
         <FormField
            control={control}
            name="murid_baru.alamat"
            render={({ field }) => (
            <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Alamat</FormLabel>
                <FormControl>
                <Textarea placeholder="Alamat lengkap..." {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
      </div>
       <p className="text-xs text-muted-foreground mt-2">
            * Data lainnya dapat dilengkapi nanti melalui menu Edit Murid.
       </p>
    </div>
  );
}
