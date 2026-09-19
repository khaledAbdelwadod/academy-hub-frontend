/** The Academy Profile "Join Request Form" tab: the questions a would-be member must answer, and the editor for them. */

import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";

import type { JoinRequestField } from "../../api/joinRequestApi";
import { listJoinRequestFields } from "../../api/joinRequestApi";
import { logger } from "../../utils/logger";
import { JoinRequestFormBuilderModal } from "../admin/JoinRequestFormBuilderModal";
import { SmallButton } from "../ui/SmallButton";

interface JoinRequestFormTabProps {
  subdomain: string;
}

function FieldList({ fields }: { fields: JoinRequestField[] | null }): ReactElement {
  if (fields === null) return <p className="mt-1 text-sm text-black/60">Loading…</p>;
  if (fields.length === 0) {
    return (
      <p className="mt-1 text-sm text-black/60">
        Define the questions someone must answer to request joining your academy. Leave it empty to show the
        default &quot;contact us&quot; message instead.
      </p>
    );
  }

  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {[...fields]
        .sort((a, b) => a.order - b.order)
        .map((field) => (
          <li key={field.id} className="flex items-start gap-2 text-sm text-black/80">
            <span className="mt-0.5 text-mint">•</span>
            <span>
              {field.label}
              {!field.required && <span className="ml-1.5 text-xs text-black/40">(optional)</span>}
            </span>
          </li>
        ))}
    </ul>
  );
}

export function JoinRequestFormTab({ subdomain }: JoinRequestFormTabProps): ReactElement {
  const [fields, setFields] = useState<JoinRequestField[] | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const reloadFields = useCallback(() => {
    listJoinRequestFields(subdomain)
      .then(setFields)
      .catch((error: unknown) => {
        logger.error("Failed to load join-request fields", { error: error instanceof Error ? error.message : error });
      });
  }, [subdomain]);

  useEffect(() => {
    reloadFields();
  }, [reloadFields]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-black">Join Request Form</h2>
        {fields !== null && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
              fields.length > 0 ? "bg-teal/15 text-teal" : "bg-gray-100 text-gray-500"
            }`}
          >
            {fields.length > 0 ? `${fields.length} field${fields.length === 1 ? "" : "s"}` : "Off"}
          </span>
        )}
      </div>

      <FieldList fields={fields} />

      <SmallButton variant="primary" onClick={() => setShowBuilder(true)} className="mt-4">
        Edit form
      </SmallButton>

      {showBuilder && (
        <JoinRequestFormBuilderModal
          subdomain={subdomain}
          onClose={() => {
            setShowBuilder(false);
            reloadFields();
          }}
        />
      )}
    </div>
  );
}
