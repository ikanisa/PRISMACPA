/**
 * FirmOS Services Gateway Protocol Schemas
 *
 * TypeBox schemas for service catalog gateway endpoints.
 */

import { Type, type Static } from "@sinclair/typebox";
import { NonEmptyString } from "./primitives.js";

// =============================================================================
// SERVICES.LIST
// =============================================================================

export const ServicesListParamsSchema = Type.Object(
  {
    jurisdiction: Type.Optional(
      Type.Union([Type.Literal("global"), Type.Literal("malta"), Type.Literal("rwanda")]),
    ),
  },
  { additionalProperties: false },
);

export type ServicesListParams = Static<typeof ServicesListParamsSchema>;

// =============================================================================
// SERVICES.GET
// =============================================================================

export const ServicesGetParamsSchema = Type.Object(
  {
    serviceId: NonEmptyString,
  },
  { additionalProperties: false },
);

export type ServicesGetParams = Static<typeof ServicesGetParamsSchema>;

// =============================================================================
// SERVICES.ROUTE
// =============================================================================

export const ServicesRouteParamsSchema = Type.Object(
  {
    jurisdiction: Type.Optional(Type.Union([Type.Literal("malta"), Type.Literal("rwanda")])),
    service: NonEmptyString,
  },
  { additionalProperties: false },
);

export type ServicesRouteParams = Static<typeof ServicesRouteParamsSchema>;

// =============================================================================
// SERVICES.VALIDATE
// =============================================================================

export const ServicesValidateParamsSchema = Type.Object({}, { additionalProperties: false });

export type ServicesValidateParams = Static<typeof ServicesValidateParamsSchema>;
