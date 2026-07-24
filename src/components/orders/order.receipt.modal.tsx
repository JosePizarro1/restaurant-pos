import React from "react";
import { Modal } from "@/components/common/react-aria/modal.tsx";
import { Button } from "@/components/common/input/button.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPrint, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import logoWarike from "@/assets/images/logo.png";
import { Order } from "@/api/model/order.ts";
import { getOrderFilteredItems } from "@/lib/order.ts";
import { formatNumber, withCurrency } from "@/lib/utils.ts";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";

import { getOrderItemDisplayLineTotal, getOrderItemModifiersDetail } from "@/lib/order-item-display.ts";
import { useShowInclusivePrices } from "@/hooks/useShowInclusivePrices.ts";

interface Props {
  open: boolean;
  onClose: () => void;
  order: Order;
  onPrintThermal?: () => void;
}

export const OrderReceiptModal = ({ open, onClose, order, onPrintThermal }: Props) => {
  const { t } = useTranslation(['orders', 'common', 'payment']);
  const { enabled: showInclusive } = useShowInclusivePrices();

  const items = getOrderFilteredItems(order);

  const subtotal = items.reduce((sum, item: any) => {
    return sum + getOrderItemDisplayLineTotal(item, showInclusive);
  }, 0);

  const discountAmount = Number(order.discount_amount || 0);
  const serviceCharge = Number(order.service_charge || 0);
  const total = Math.max(0, subtotal - discountAmount + serviceCharge);
  const igv18 = total * 0.18 / 1.18;
  const baseAmount = total - igv18;

  const dateFormatted = typeof order.created_at === 'string'
    ? DateTime.fromISO(order.created_at).toFormat("dd/MM/yyyy hh:mm a")
    : DateTime.now().toFormat("dd/MM/yyyy hh:mm a");

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-neutral-800">
          <FontAwesomeIcon icon={faEye} className="text-amber-500" />
          <span>{t('orders:actions.previewTempBill')}</span>
        </div>
      }
      size="md"
    >
      <div className="flex flex-col gap-4">
        {/* Printable Ticket Receipt (80mm width look) */}
        <div className="p-6 bg-amber-50/40 rounded-xl border border-amber-200/60 shadow-inner max-h-[500px] overflow-y-auto print:p-0 print:border-none print:shadow-none font-mono text-neutral-800 text-sm">
          <div className="w-[300px] mx-auto flex flex-col items-center gap-2 text-center bg-white p-5 rounded-lg shadow-sm border border-neutral-200 print:w-full print:border-none print:shadow-none">
            
            {/* Logo & Header */}
            <img src={logoWarike} alt="El Warike Arequipeño" className="w-20 h-20 object-contain mb-1" />
            <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-900">El Warike Arequipeño</h2>
            <p className="text-xs text-neutral-500">Comida Típica Arequipeña</p>
            <p className="text-xs font-semibold text-neutral-700 uppercase border-y border-dashed border-neutral-300 py-1 w-full my-1">
              *** PRE-CUENTA / FACTURA TEMPORAL ***
            </p>

            {/* Meta details */}
            <div className="w-full text-left text-xs text-neutral-600 flex flex-col gap-1 border-b border-dashed border-neutral-300 pb-3 mb-2">
              <div className="flex justify-between">
                <span>Pedido:</span>
                <span className="font-bold text-neutral-900">#{order.invoice_number || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span>Fecha:</span>
                <span>{dateFormatted}</span>
              </div>
              {order.table && (
                <div className="flex justify-between">
                  <span>Mesa:</span>
                  <span className="font-bold text-neutral-900">{typeof order.table === 'object' ? (order.table as any).name : String(order.table)}</span>
                </div>
              )}
            </div>

            {/* Items table */}
            <table className="w-full text-xs text-left mb-3">
              <thead>
                <tr className="border-b border-neutral-300 text-neutral-700">
                  <th className="pb-1 w-8">Cant</th>
                  <th className="pb-1">Descripción</th>
                  <th className="pb-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((item: any, idx) => {
                  const lineTotal = getOrderItemDisplayLineTotal(item, showInclusive);
                  const dishName = item?.item?.name || item?.dish?.name || 'Plato';
                  const modifiers = getOrderItemModifiersDetail(item, showInclusive);
                  return (
                    <tr key={idx} className="align-top">
                      <td className="py-1.5 font-bold">{item.quantity}</td>
                      <td className="py-1.5 pr-2">
                        <div>{dishName}</div>
                        {modifiers.map((mod, mIdx) => (
                          <div
                            key={mIdx}
                            className="text-[10px] text-neutral-500"
                            style={{ paddingLeft: `${Math.max(1, mod.depth) * 4}px` }}
                          >
                            + {mod.name}
                            {mod.quantity > 1 ? ` (x${mod.quantity})` : ''}
                            {mod.price > 0 ? ` (+${withCurrency(mod.price)})` : ''}
                          </div>
                        ))}
                      </td>
                      <td className="py-1.5 text-right font-medium">{withCurrency(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div className="w-full border-t border-dashed border-neutral-300 pt-3 text-xs flex flex-col gap-1.5">
              <div className="flex justify-between text-neutral-600">
                <span>Op. Grabada:</span>
                <span>{withCurrency(baseAmount)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>IGV (18%):</span>
                <span>{withCurrency(igv18)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento:</span>
                  <span>-{withCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-neutral-900 border-t border-neutral-300 pt-2 mt-1">
                <span>TOTAL:</span>
                <span>{withCurrency(total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="w-full border-t border-dashed border-neutral-300 pt-3 mt-2 text-center text-[11px] text-neutral-500">
              <p>¡Gracias por su visita!</p>
              <p className="italic text-[10px] mt-0.5">Comprobante no válido como factura fiscal</p>
            </div>

          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2 border-t border-neutral-200">
          <Button variant="secondary" onClick={onClose}>
            {t('common:actions.close')}
          </Button>
          <Button variant="primary" onClick={handleBrowserPrint} icon={faFilePdf}>
            PDF / Imprimir Navegador
          </Button>
          {onPrintThermal && (
            <Button variant="warning" onClick={() => { onPrintThermal(); onClose(); }} icon={faPrint}>
              Impresora Térmica POS
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
