import { Event } from '@tietokilta/ilmomasiina-models/src/services/events';
import apiFetch from '../../api';
import { useAbortablePromise } from '../../utils/abortable';
import { createStateContext } from '../../utils/stateContext';
import useShallowMemo from '../../utils/useShallowMemo';

export type EventListProps = {
  category?: string;
};

type State = {
  events?: Event.List;
  pending: boolean;
  error: boolean;
};

const { Provider, useStateContext } = createStateContext<State>();
export { useStateContext as useEventListContext, Provider as EventListProvider };

export function useEventListState({ category }: EventListProps) {
  const fetchEvents = useAbortablePromise(async (signal) => {
    const query = category === undefined ? '' : `?${new URLSearchParams({ category })}`;
    return await apiFetch(`events${query}`, { signal }) as Event.List;
  }, [category]);

  return useShallowMemo<State>({
    events: fetchEvents.result,
    pending: fetchEvents.pending,
    error: fetchEvents.error,
  });
}
