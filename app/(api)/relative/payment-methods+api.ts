/*
	FILE: app/(api)/relative/payment-methods+api.ts
	PURPOSE: GET /api/relative/payment-methods
					 POST /api/relative/payment-methods
					 Manage payment methods for the relative user.

	GET: returns list of payment methods for the authenticated relative
	POST: adds a new payment method; if is_default = true, demote others
*/
import { ApiAuthError, requireRelative } from "@/lib/server-auth";
import { db, dbTransaction } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { user } = await requireRelative(request);

    const rows = await db<any>`
			SELECT id, stripe_customer_id, stripe_payment_method_id, card_brand, card_last4, exp_month, exp_year, is_default, created_at
			FROM payment_methods
			WHERE user_id = ${user.id}
			ORDER BY is_default DESC, created_at DESC
		`;

    return Response.json({
      success: true,
      data: { paymentMethods: rows || [] },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/payment-methods GET] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const stripeCustomerId =
      typeof body.stripe_customer_id === "string"
        ? body.stripe_customer_id.trim()
        : null;
    const stripePaymentMethodId =
      typeof body.stripe_payment_method_id === "string"
        ? body.stripe_payment_method_id.trim()
        : "";
    const cardBrand =
      typeof body.card_brand === "string" ? body.card_brand.trim() : null;
    const cardLast4 =
      typeof body.card_last4 === "string" ? body.card_last4.trim() : null;
    const expMonth = typeof body.exp_month === "number" ? body.exp_month : null;
    const expYear = typeof body.exp_year === "number" ? body.exp_year : null;
    const isDefault = !!body.is_default;

    if (!stripePaymentMethodId || stripePaymentMethodId.length === 0) {
      return Response.json(
        { error: "stripe_payment_method_id is required" },
        { status: 400 },
      );
    }

    const { user } = await requireRelative(request);

    if (isDefault) {
      const result = await dbTransaction(async (tx) => {
        await tx`
					UPDATE payment_methods SET is_default = false WHERE user_id = ${user.id} AND is_default = true
				`;

        const insertedRaw = await tx`
					INSERT INTO payment_methods (user_id, stripe_customer_id, stripe_payment_method_id, card_brand, card_last4, exp_month, exp_year, is_default)
					VALUES (${user.id}, ${stripeCustomerId}, ${stripePaymentMethodId}, ${cardBrand}, ${cardLast4}, ${expMonth}, ${expYear}, ${true})
					RETURNING id, stripe_customer_id, stripe_payment_method_id, card_brand, card_last4, exp_month, exp_year, is_default, created_at
				`;

        return (insertedRaw as any[])[0];
      });

      return Response.json(
        { success: true, data: { paymentMethod: result } },
        { status: 201 },
      );
    }

    const insertedRaw = await db`
			INSERT INTO payment_methods (user_id, stripe_customer_id, stripe_payment_method_id, card_brand, card_last4, exp_month, exp_year, is_default)
			VALUES (${user.id}, ${stripeCustomerId}, ${stripePaymentMethodId}, ${cardBrand}, ${cardLast4}, ${expMonth}, ${expYear}, ${false})
			RETURNING id, stripe_customer_id, stripe_payment_method_id, card_brand, card_last4, exp_month, exp_year, is_default, created_at
		`;

    const insertedRow = (insertedRaw as any[])[0];

    return Response.json(
      { success: true, data: { paymentMethod: insertedRow } },
      { status: 201 },
    );
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/payment-methods POST] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
