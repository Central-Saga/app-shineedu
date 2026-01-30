import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  backHref?: string;
}

export function PageHeader({ title, description, actions, backHref }: PageHeaderProps) {
  return (
    <div className="mb-4 flex justify-between items-start md:items-center gap-3">
      <div className="flex items-center gap-3">
        {backHref && (
          <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
