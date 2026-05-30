import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";

type NoteType =
  | "custom"
  | "medication_given"
  | "elder_resting"
  | "meal_completed"
  | "mobility_assistance"
  | "blood_pressure_checked"
  | "hydration_reminder"
  | "other";

export function useAddNote(sessionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      note_type = "custom",
    }: {
      content: string;
      note_type?: NoteType;
    }) => {
      const res = await fetchAPI(`/api/care-sessions/${sessionId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: content.trim(), note_type }),
      });
      return res.data.note;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["session", sessionId, "notes"],
      });
    },
  });
}

export default useAddNote;
