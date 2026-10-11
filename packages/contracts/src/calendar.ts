export type CalendarEventType =
  | 'MANUAL'
  | 'DATE_LINKED'
  | 'ANNIVERSARY'
  | 'REMINDER';

export interface CalendarEventItem {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  title: string;
  description: string | null;
  eventType: CalendarEventType;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  linkedDatePlanId: string | null;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  eventType?: CalendarEventType;
  startAt: string;
  endAt?: string;
  allDay?: boolean;
  linkedDatePlanId?: string;
}

export interface UpdateCalendarEventRequest {
  title?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
}
