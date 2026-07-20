'use strict';

const {
  normalizeConfig,
  printReceiptHeader,
  printLineLeftRight,
  formatMoney,
  printVatLine,
  feedBottomMargin,
} = require('../lib/receipt-helpers');
const { computeSummary, formatNum } = require('../lib/summary-mapping');

function pct(x, of) {
  const n = Number(of);
  return Number.isFinite(n) && n > 0 ? (Number(x) / n) * 100 : 0;
}

function sect(printer, title) {
  printer.drawLine();
  printer.align('ct').style('bu').text(title).style('normal');
  printer.align('lt');
}

function printMixRow(printer, left, qty, total, share, sym, options = {}) {
  const { bold = false, indent = 0 } = options;
  const pad = ' '.repeat(indent);
  const label = `${pad}${String(left).slice(0, 22)}`;
  const right = `${formatNum(qty)}  ${formatMoney(total, sym)}  ${formatNum(share)}%`;
  if (bold) {
    printer.style('bu');
  }
  printLineLeftRight(printer, label, right);
  if (bold) {
    printer.style('normal');
  }
}

function printProductMix(printer, categoryMix, exclusiveSales, sym) {
  printLineLeftRight(printer, 'Ítem', 'Cant   Total   %');
  if (!categoryMix || categoryMix.length === 0) {
    printer.text('No hay datos de categoría para esta fecha.');
    return;
  }

  const ex = exclusiveSales;
  categoryMix.forEach((category) => {
    printMixRow(
      printer,
      category.name,
      category.quantity,
      category.total,
      pct(category.total, ex),
      sym,
      { bold: true }
    );

    (category.dishes || []).forEach((dish) => {
      printMixRow(
        printer,
        dish.name,
        dish.quantity,
        dish.total,
        pct(dish.total, ex),
        sym,
        { indent: 2 }
      );

      (dish.modifiers || []).forEach((modifier) => {
        const depth = Number.isFinite(Number(modifier.depth)) ? Number(modifier.depth) : 1;
        const indent = 2 + depth * 2;
        const modLabel = `- ${modifier.name}`;
        printLineLeftRight(
          printer,
          `${' '.repeat(indent)}${String(modLabel).slice(0, 20)}`,
          `${formatNum(modifier.quantity)}  ${formatNum(modifier.price)}`
        );
      });
    });
  });
}

function printPaymentTypes(printer, paymentTypes, amountDue, sym, line) {
  const rows = (paymentTypes || []).filter((payment) => safeNumber(payment.total) > 0);
  if (rows.length === 0) {
    printer.text('No hay datos de pago para esta fecha.');
    return;
  }
  rows.forEach((payment) => {
    const share = formatNum(pct(payment.total, amountDue)) + '%';
    line(payment.name, `${formatMoney(payment.total, sym)}  ${share}`);
  });
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function printDailySalesSummary(printer, data, cfg) {
  const sym = cfg.currencySymbol || '$';
  const s = computeSummary(data);
  const line = (left, right) => printLineLeftRight(printer, left, right);

  printer.align('ct').style('bu').text(`Resumen de ventas diarias - ${s.date}`).style('normal');
  printer.align('lt');
  printer.drawLine();

  sect(printer, '1. Ingresos por ventas');
  line('Ventas exclusivas', formatMoney(s.exclusiveSales, sym));
  line('Extras', formatMoney(s.totalExtras, sym));
  line('Ventas brutas', formatMoney(s.grossSales, sym));
  line('Descuentos por ítem', formatMoney(s.itemDiscounts, sym));
  line('Descuentos de subtotal', formatMoney(s.subtotalDiscounts, sym));
  line('Descuentos por cupón', formatMoney(s.couponDiscounts, sym));
  line('(-) Descuentos', formatMoney(s.discounts, sym));
  line('Ventas netas', formatMoney(s.netSales, sym));

  sect(printer, '2. Recargos e impuestos');
  line('Cargos por servicio', formatMoney(s.serviceCharges, sym));
  line('Impuestos', formatMoney(s.taxCollected, sym));
  printer.style('bu');
  line('Ingresos totales', formatMoney(s.totalRevenue, sym));
  printer.style('normal');

  sect(printer, '3. Liquidación y cajero');
  line('Monto a pagar (sin propinas)', formatMoney(s.amountDue, sym));
  line('Propinas', formatMoney(s.tips, sym));
  printer.style('bu');
  line('Total general (a pagar)', formatMoney(s.grandTotalDue, sym));
  printer.style('normal');
  line('Monto cobrado', formatMoney(s.amountCollected, sym));
  line('Redondeo', formatMoney(s.rounding, sym));
  line('Vuelto / diferencia', formatMoney(s.changeGiven, sym));

  sect(printer, '4. Controles operacionales');
  line('Anulaciones', formatMoney(s.voids, sym));
  line('Reembolsos', formatMoney(s.refunds, sym));
  line('Cubiertos', formatNum(s.covers));
  line('Promedio por cubierto', formatMoney(s.averageCover, sym));
  line('Pedidos / cuentas', formatNum(s.ordersCount));
  line('Pedido / cuenta promedio', formatMoney(s.averageOrderCheck, sym));

  sect(printer, '5. Mix de productos');
  printProductMix(printer, s.categoryMix, s.exclusiveSales, sym);

  sect(printer, '6. Tipos de pago');
  printPaymentTypes(printer, s.paymentTypes, s.amountDue, sym, line);

  sect(printer, '7. Desglose de impuestos');
  if (!s.taxesList || s.taxesList.length === 0) {
    printer.text('No hay filas de impuestos para esta fecha.');
  } else {
    s.taxesList.forEach((tax) => {
      const share = formatNum(pct(tax.total, s.taxCollected)) + '%';
      line(`${tax.name}%`, `${formatMoney(tax.total, sym)}  ${share}`);
    });
  }

  sect(printer, '8. Desglose de descuentos');
  if (!s.discountsList || s.discountsList.length === 0) {
    printer.text('No hay filas de descuentos para esta fecha.');
  } else {
    s.discountsList.forEach((discount) => {
      const share = formatNum(pct(discount.total, s.discounts)) + '%';
      line(discount.name, `${formatMoney(discount.total, sym)}  ${share}`);
    });
  }

  sect(printer, '9. Desglose de extras');
  if (!s.extrasList || s.extrasList.length === 0) {
    printer.text('No se encontraron extras para esta fecha.');
  } else {
    s.extrasList.forEach((extra) => {
      const share = formatNum(pct(extra.total, s.totalExtras)) + '%';
      line(extra.name, `${formatMoney(extra.total, sym)}  ${share}`);
    });
  }

  sect(printer, '10. Desglose de cupones');
  if (!s.couponsList || s.couponsList.length === 0) {
    printer.text('No hay uso de cupones para esta fecha.');
  } else {
    s.couponsList.forEach((coupon) => {
      line(coupon.name, formatMoney(coupon.total, sym));
    });
  }

  printVatLine(printer, cfg);
  feedBottomMargin(printer, cfg);
  printer.feed(2).cut();
}

function build(printer, data = {}, config = {}) {
  const orders = data && data.orders;
  const hasArray = Array.isArray(orders);
  const hasDataArray = orders && Array.isArray(orders.data);
  if (!hasArray && !hasDataArray) {
    return Promise.reject(new Error('data.orders (Order[]) is required for summary print'));
  }

  const cfg = normalizeConfig(config);

  return printReceiptHeader(printer, cfg).then(() => {
    printDailySalesSummary(printer, data, cfg);
    return printer;
  });
}

module.exports = { build };
