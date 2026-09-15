/** An academy manager's "Membership Requests" tab: review and approve/reject pending join requests. */

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import type { ManagerMembershipRequestList, ManagerMembershipRequestRow } from "../api/managerMembershipRequestsApi";
import { buildMembershipRequestsUrl, listMembershipRequests } from "../api/managerMembershipRequestsApi";
import { removeMember, updateMember } from "../api/managerMembersApi";
import { SmallButton } from "../components/ui/SmallButton";
import { logger } from "../utils/logger";
import { getAcademySubdomain } from "../utils/subdomain";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: ManagerMembershipRequestList };

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export function MembershipRequestsPage(): ReactElement {
  const subdomain = getAcademySubdomain();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [name, setName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function load(url?: string): void {
    if (!subdomain) return;
    setState({ status: "loading" });
    listMembershipRequests(url, subdomain)
      .then((page) => setState({ status: "ready", page }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load membership requests.";
        logger.error("Failed to load membership requests", { error: message });
        setState({ status: "error", message });
      });
  }

  useEffect(() => {
    if (!subdomain) return undefined;
    const timeout = window.setTimeout(() => {
      load(buildMembershipRequestsUrl(subdomain, name));
    }, 300);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only reacts to name/subdomain
  }, [name, subdomain]);

  function reload(): void {
    if (!subdomain) return;
    load(buildMembershipRequestsUrl(subdomain, name));
  }

  function handleApprove(request: ManagerMembershipRequestRow): void {
    if (!subdomain) return;
    setActionError(null);
    setBusyId(request.id);
    updateMember(subdomain, request.id, { status: "active" })
      .then(() => reload())
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not approve that request.";
        logger.error("Failed to approve membership request", { error: message });
        setActionError(message);
      })
      .finally(() => setBusyId(null));
  }

  function handleReject(request: ManagerMembershipRequestRow): void {
    if (!subdomain) return;
    const warning = `Reject ${request.first_name} ${request.last_name}'s request to join?`;
    if (!window.confirm(warning)) return;

    setActionError(null);
    setBusyId(request.id);
    removeMember(subdomain, request.id)
      .then(() => reload())
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not reject that request.";
        logger.error("Failed to reject membership request", { error: message });
        setActionError(message);
      })
      .finally(() => setBusyId(null));
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1100px] flex-col px-4 py-6 sm:px-8">
      <div className="mb-4 flex shrink-0 items-center">
        <input
          type="text"
          value={name}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
          placeholder="Search by name…"
          className="w-full max-w-xs rounded-md border border-mint bg-white px-3 py-1.5 text-sm text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
        />
      </div>

      {actionError && (
        <p className="mb-4 shrink-0 text-sm text-red-400 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{actionError}</p>
      )}
      {state.status === "error" && (
        <p className="mb-4 shrink-0 text-sm text-red-400 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
          {state.message}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {state.status === "loading" && <p className="py-10 text-center text-gray-500">Loading requests…</p>}
        {state.status === "ready" && state.page.results.length === 0 && (
          <p className="py-10 text-center text-gray-400">No pending requests.</p>
        )}

        {state.status === "ready" && state.page.results.length > 0 && (
          <div className="flex flex-col gap-4">
            {state.page.results.map((request) => (
              <div
                key={request.id}
                className="rounded-[22px] border border-mint bg-white/40 p-5 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-150 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-black">
                      {request.first_name} {request.last_name}
                    </p>
                    <p className="text-sm text-black/60">
                      {request.email} · {request.phone} · {formatDate(request.date_of_birth)}
                    </p>
                    <p className="mt-0.5 text-xs text-black/40">Requested {formatDate(request.joined_at)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <SmallButton
                      variant="primary"
                      disabled={busyId === request.id}
                      onClick={() => handleApprove(request)}
                    >
                      Approve
                    </SmallButton>
                    <SmallButton variant="danger" disabled={busyId === request.id} onClick={() => handleReject(request)}>
                      Reject
                    </SmallButton>
                  </div>
                </div>

                {request.answers.length > 0 && (
                  <dl className="mt-4 flex flex-col gap-2.5 border-t border-mint pt-4">
                    {request.answers.map((entry) => (
                      <div key={entry.field_id}>
                        <dt className="text-xs font-bold uppercase tracking-wide text-mint">{entry.label}</dt>
                        <dd className="mt-0.5 text-sm text-black/80">{entry.answer || <span className="text-black/30">—</span>}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {state.status === "ready" && (
        <div className="mt-4 flex shrink-0 items-center justify-between text-sm text-gray-500">
          <span>{state.page.count} total</span>
          <div className="flex gap-2">
            <SmallButton disabled={!state.page.previous} onClick={() => state.page.previous && load(state.page.previous)}>
              Previous
            </SmallButton>
            <SmallButton disabled={!state.page.next} onClick={() => state.page.next && load(state.page.next)}>
              Next
            </SmallButton>
          </div>
        </div>
      )}
    </div>
  );
}
