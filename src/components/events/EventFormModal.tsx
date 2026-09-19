/** A modal to create or edit a calendar event: title, description, day/time, and who it's for. */

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { AudienceOptions, CalendarEvent, EventInput } from "../../api/eventApi";
import { createEvent, getAudienceOptions, updateEvent } from "../../api/eventApi";
import {
  combineDateAndTime,
  minutesBetween,
  shiftTime,
  toDateKey,
  toTimeInput,
} from "../../utils/calendarDates";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { ModalShell } from "../ui/ModalShell";
import { AudiencePicker } from "./AudiencePicker";

const DEFAULT_START_TIME = "09:00";
const DEFAULT_DURATION_MINUTES = 60;

interface EventFormModalProps {
  subdomain: string;
  /** The event being edited, or null to create a new one. */
  event: CalendarEvent | null;
  /** The day ("YYYY-MM-DD") a new event starts on; ignored when editing. */
  defaultDay: string;
  onClose: () => void;
  onSaved: () => void;
}

type OptionsState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; options: AudienceOptions };
type SaveState = { status: "idle" } | { status: "saving" } | { status: "error"; message: string };

function toggled(current: Set<number>, id: number): Set<number> {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function EventFormModal({ subdomain, event, defaultDay, onClose, onSaved }: EventFormModalProps): ReactElement {
  const isCreate = event === null;
  const existingStart = event ? new Date(event.start) : null;

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [address, setAddress] = useState(event?.address ?? "");
  const [mapsUrl, setMapsUrl] = useState(event?.google_maps_url ?? "");
  const [day, setDay] = useState(existingStart ? toDateKey(existingStart) : defaultDay);
  const [startTime, setStartTime] = useState(existingStart ? toTimeInput(existingStart) : DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(
    event ? toTimeInput(new Date(event.end)) : shiftTime(DEFAULT_START_TIME, DEFAULT_DURATION_MINUTES),
  );
  const [teamIds, setTeamIds] = useState<Set<number>>(new Set(event?.teams.map((team) => team.id) ?? []));
  const [memberIds, setMemberIds] = useState<Set<number>>(new Set(event?.invitees.map((member) => member.id) ?? []));
  const [optionsState, setOptionsState] = useState<OptionsState>({ status: "loading" });
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  useEffect(() => {
    getAudienceOptions(subdomain)
      .then((options) => setOptionsState({ status: "ready", options }))
      .catch((error: unknown) =>
        setOptionsState({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load who you can invite.",
        }),
      );
  }, [subdomain]);

  /** Moving the start carries the end along, so the event keeps its length. */
  function handleStartTimeChange(nextStart: string): void {
    const length = minutesBetween(startTime, endTime);
    setStartTime(nextStart);
    setEndTime(shiftTime(nextStart, length > 0 ? length : DEFAULT_DURATION_MINUTES));
  }

  function handleSubmit(submitEvent: FormEvent<HTMLFormElement>): void {
    submitEvent.preventDefault();
    const start = combineDateAndTime(day, startTime);
    const end = combineDateAndTime(day, endTime);
    if (end <= start) {
      setSaveState({ status: "error", message: "The end time must be after the start time." });
      return;
    }

    const data: EventInput = {
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      google_maps_url: mapsUrl.trim(),
      start: start.toISOString(),
      end: end.toISOString(),
      team_ids: Array.from(teamIds),
      invitee_ids: Array.from(memberIds),
    };
    setSaveState({ status: "saving" });
    const request = event ? updateEvent(subdomain, event.id, data) : createEvent(subdomain, data);
    request
      .then(() => onSaved())
      .catch((error: unknown) =>
        setSaveState({
          status: "error",
          message: error instanceof Error ? error.message : "Could not save that event.",
        }),
      );
  }

  const hasAudience = teamIds.size + memberIds.size > 0;
  const canSubmit = title.trim() !== "" && day !== "" && hasAudience && saveState.status !== "saving";

  return (
    <ModalShell title={isCreate ? "New Event" : "Edit Event"} onClose={onClose} maxWidthClassName="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          id="event-title"
          label="Title"
          value={title}
          onChange={(changeEvent: ChangeEvent<HTMLInputElement>) => setTitle(changeEvent.target.value)}
          placeholder="e.g. Saturday training"
          maxLength={200}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="event-description" className="text-xs font-bold uppercase tracking-wider text-black/80">
            Description <span className="ml-1 font-medium normal-case tracking-normal text-black/40">(optional)</span>
          </label>
          <textarea
            id="event-description"
            value={description}
            onChange={(changeEvent: ChangeEvent<HTMLTextAreaElement>) => setDescription(changeEvent.target.value)}
            rows={3}
            className="w-full rounded-xl border border-mint bg-white px-3.5 py-3 text-sm text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormField
            id="event-day"
            label="Day"
            type="date"
            value={day}
            onChange={(changeEvent: ChangeEvent<HTMLInputElement>) => setDay(changeEvent.target.value)}
            required
          />
          <FormField
            id="event-start"
            label="Starts"
            type="time"
            value={startTime}
            onChange={(changeEvent: ChangeEvent<HTMLInputElement>) => handleStartTimeChange(changeEvent.target.value)}
            required
          />
          <FormField
            id="event-end"
            label="Ends"
            type="time"
            value={endTime}
            onChange={(changeEvent: ChangeEvent<HTMLInputElement>) => setEndTime(changeEvent.target.value)}
            required
          />
        </div>

        <FormField
          id="event-address"
          label="Location address"
          optional
          value={address}
          onChange={(changeEvent: ChangeEvent<HTMLInputElement>) => setAddress(changeEvent.target.value)}
          placeholder="e.g. 12 Nile St, Cairo"
          maxLength={500}
        />
        <FormField
          id="event-maps-url"
          label="Google Maps link"
          optional
          type="url"
          value={mapsUrl}
          onChange={(changeEvent: ChangeEvent<HTMLInputElement>) => setMapsUrl(changeEvent.target.value)}
          placeholder="https://maps.google.com/…"
          maxLength={500}
        />

        {optionsState.status === "loading" && <p className="text-sm text-gray-500">Loading who you can invite…</p>}
        {optionsState.status === "error" && <p className="text-sm text-red-400">{optionsState.message}</p>}
        {optionsState.status === "ready" && (
          <AudiencePicker
            options={optionsState.options}
            selectedTeamIds={teamIds}
            selectedMemberIds={memberIds}
            onToggleTeam={(teamId) => setTeamIds((current) => toggled(current, teamId))}
            onToggleMember={(membershipId) => setMemberIds((current) => toggled(current, membershipId))}
          />
        )}
        {optionsState.status === "ready" && !hasAudience && (
          <p className="text-xs text-black/50">Pick at least one team or member to invite.</p>
        )}

        {saveState.status === "error" && <p className="text-sm text-red-400">{saveState.message}</p>}

        <AuthButton type="submit" fullWidth={false} disabled={!canSubmit}>
          {saveState.status === "saving" ? "Saving…" : isCreate ? "Create event" : "Save changes"}
        </AuthButton>
      </form>
    </ModalShell>
  );
}
