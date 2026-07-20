'use strict';

const {
  normalizeConfig,
  printReceiptHeader,
  printLineLeftRight,
  formatMoney,
  printVatLine,
  feedBottomMargin,
} = require('../lib/receipt-helpers');
const { mapOrderToRefund } = require('../lib/order-mapping');

/**
 * Refund print – REFUND RECEIPT. Matches refund.bill.tsx.
 * Expects data: { order: refundOrder, originalOrder }.
 * refundOrder: items (selected to refund), tax_amount, discount_amount, service_charge_amount, tip_amount, extras.
 */
function build(printer, data = {}, config = {}) {
  const refundOrder = data && data.order;
  const originalOrder = data && data.originalOrder;
  if (!refundOrder) {
    return Promise.reject(new Error('data.order (refund order) is required for refund print'));
  }

  const cfg = normalizeConfig(config);
  const bill = mapOrderToRefund(refundOrder, originalOrder, {
    showInclusivePrices: !!cfg.showInclusivePrices,
  });

  return printReceiptHeader(printer, cfg).then(() => {
    // --- REFUND RECEIPT header ---
    printer.align('ct').style('bu').text('RECIBO DE REEMBOLSO').style('normal');
    printLineLeftRight(printer, `Factura/Boleta Orig.# ${bill.originalOrderId || ''}`, '');
    printLineLeftRight(printer, `Mesa: ${bill.table || '-'}`, `Tipo Pedido: ${bill.orderType || '-'}`);
    printLineLeftRight(printer, `Cajero: ${bill.userName || '-'}`, '');
    printLineLeftRight(printer, `Fecha Reembolso: ${bill.refundDate || ''}`, '');
    printer.drawLine();

    // --- Items ---
    (bill.items || []).forEach((it) => {
      const name = (it.name || it.title || '').slice(0, 28);
      const qty = it.qty != null ? it.qty : 1;
      const lineTotal = it.total != null ? Number(it.total) : (it.price || 0) * qty;
      printLineLeftRight(printer, `${name} x${qty}`, formatMoney(lineTotal, cfg.currencySymbol || '$'));
    });
    printer.drawLine();

    // --- Summary: Items(n), Tax, Discount, Service, extras, Tip ---
    printLineLeftRight(printer, `Productos (${bill.itemsCount || 0})`, formatMoney(bill.itemsTotal, cfg.currencySymbol || '$'));
    if (bill.tax != null && Number(bill.tax) !== 0) {
      printLineLeftRight(printer, `Impuesto (${bill.taxLabel || 'Impuesto'})`, formatMoney(bill.tax, cfg.currencySymbol || '$'));
    }
    if (bill.discount && bill.discountAmount != null && Number(bill.discountAmount) !== 0) {
      printLineLeftRight(printer, 'Descuento', formatMoney(bill.discountAmount, cfg.currencySymbol || '$'));
    }
    if (bill.serviceChargeLabel && bill.serviceChargeAmount != null && Number(bill.serviceChargeAmount) !== 0) {
      printLineLeftRight(printer, bill.serviceChargeLabel, formatMoney(bill.serviceChargeAmount, cfg.currencySymbol || '$'));
    }
    (bill.extras || []).forEach((e) => {
      printLineLeftRight(printer, e.name || 'Extra', formatMoney(e.value, cfg.currencySymbol || '$'));
    });
    if (bill.tipAmount != null && Number(bill.tipAmount) !== 0) {
      printLineLeftRight(printer, bill.tipLabel || 'Propina', formatMoney(bill.tipAmount, cfg.currencySymbol || '$'));
    }
    printer.drawLine();

    // --- Refund Total (bold) ---
    printer.style('bu');
    printLineLeftRight(printer, 'Total Reembolso', formatMoney(bill.total, cfg.currencySymbol || '$'));
    printer.style('normal');

    printVatLine(printer, cfg);
    feedBottomMargin(printer, cfg);
    printer.feed(1).cut();
    return printer;
  });
}

module.exports = { build };
