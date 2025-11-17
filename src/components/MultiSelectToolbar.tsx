"use client";

import { useMultiSelect } from "@/context/MultiSelectContext";
import { useCardContext } from "@/context/CardContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "./ui/button";
import { Trash2, CheckSquare, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function MultiSelectToolbar() {
  const { selectedIds, selectAll, deselectAll, hasSelection } = useMultiSelect();
  const { state, dispatch } = useCardContext();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [newQuantity, setNewQuantity] = useState(1);

  const handleSelectAll = () => {
    selectAll(state.rows.map(r => r.id));
  };

  const handleDeleteSelected = () => {
    dispatch({ type: 'REMOVE_ROWS', payload: { ids: selectedIds } });
    toast({
      title: t('toast.bulkDeleteSuccess.title'),
      description: t('toast.bulkDeleteSuccess.description', { count: selectedIds.length.toString() }),
    });
    deselectAll();
  };

  const handleSetQuantity = () => {
    if (newQuantity >= 1) {
      dispatch({ type: 'UPDATE_ROWS', payload: { ids: selectedIds, data: { quantity: newQuantity } } });
      toast({
        title: t('toast.bulkQuantityUpdated.title'),
        description: t('toast.bulkQuantityUpdated.description', { count: selectedIds.length.toString() }),
      });
      setShowQuantityDialog(false);
      deselectAll();
    }
  };

  if (!hasSelection) return null;

  return (
    <>
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {t('multiSelect.selectedCount', { count: selectedIds.length.toString() })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectedIds.length === state.rows.length ? deselectAll : handleSelectAll}
          >
            {selectedIds.length === state.rows.length ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                {t('multiSelect.deselectAll')}
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                {t('multiSelect.selectAll')}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuantityDialog(true)}
          >
            {t('multiSelect.setQuantity')}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('multiSelect.deleteSelected')}
          </Button>
        </div>
      </div>

      <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('multiSelect.setQuantity')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="quantity">{t('multiSelect.enterQuantity')}</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={newQuantity}
              onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuantityDialog(false)}>
              {t('scryfallModal.cancel')}
            </Button>
            <Button onClick={handleSetQuantity}>
              {t('scryfallModal.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
