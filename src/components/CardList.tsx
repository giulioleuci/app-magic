
import type { CardRow as CardRowType } from "@/lib/types";
import CardItem from "./CardItem";

interface CardListProps {
  rows: CardRowType[];
}

export default function CardList({ rows }: CardListProps) {
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <CardItem key={row.id} row={row} />
      ))}
    </div>
  );
}
