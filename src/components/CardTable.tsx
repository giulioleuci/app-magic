
import type { CardRow as CardRowType } from "@/lib/types";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CardRow from "./CardRow";
import { useLanguage } from "@/context/LanguageContext";

interface CardTableProps {
  rows: CardRowType[];
}

export default function CardTable({ rows }: CardTableProps) {
  const { t } = useLanguage();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">{t('table.image')}</TableHead>
          <TableHead>{t('table.cardName')}</TableHead>
          <TableHead className="w-[150px]">{t('table.quantity')}</TableHead>
          <TableHead className="w-[180px]">{t('table.provider')}</TableHead>
          <TableHead className="w-[200px] text-right">{t('table.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <CardRow key={row.id} row={row} />
        ))}
      </TableBody>
    </Table>
  );
}
