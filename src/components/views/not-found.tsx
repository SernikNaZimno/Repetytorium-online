import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NotFound({ text = "Nie znaleziono modułu." }: { text?: string }) {
  return (
    <Card className="items-center p-10 text-center">
      <p>{text}</p>
      <Button asChild variant="outline">
        <Link href="/">Strona główna</Link>
      </Button>
    </Card>
  );
}
