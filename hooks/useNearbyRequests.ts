import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { fetchAPI } from "@/lib/fetch";

export type RequestRow = {
  id: number;
  elder_name: string;
  care_type: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  estimated_pay: number;
  distance_km: number | null;
};

export function useNearbyRequests() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["caregiver", "requests"],
    queryFn: async () => {
      const res = await fetchAPI("/api/caregivers/me/requests");
      return res.data as RequestRow[];
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 20_000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await fetchAPI(`/api/care-sessions/${sessionId}/accept`, {
        method: "POST",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caregiver", "requests"] });
      queryClient.invalidateQueries({
        queryKey: ["caregiver", "active-session"],
      });
      queryClient.invalidateQueries({ queryKey: ["caregiver", "schedule"] });
    },
    onError: () => {
      Alert.alert("Could not accept booking", "Please try again.");
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await fetchAPI(`/api/care-sessions/${sessionId}/decline`, {
        method: "POST",
      });
      return res.data;
    },
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: ["caregiver", "requests"] });
      queryClient.setQueryData<RequestRow[]>(["caregiver", "requests"], (old) =>
        (old ?? []).filter((request) => request.id !== sessionId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caregiver", "requests"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["caregiver", "requests"] });
      Alert.alert("Could not decline booking", "Please try again.");
    },
  });

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    acceptRequest: acceptMutation.mutate,
    declineRequest: declineMutation.mutate,
    isAccepting: acceptMutation.isPending,
    isDeclining: declineMutation.isPending,
  };
}

export function useAcceptRequest() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await fetchAPI(`/api/care-sessions/${sessionId}/accept`, {
        method: "POST",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caregiver", "requests"] });
      queryClient.invalidateQueries({
        queryKey: ["caregiver", "active-session"],
      });
      queryClient.invalidateQueries({ queryKey: ["caregiver", "schedule"] });
      Alert.alert("Booking accepted");
    },
    onError: () => {
      Alert.alert("Could not accept booking", "Please try again.");
    },
  });

  return {
    acceptRequest: mutation.mutate,
    isAccepting: mutation.isPending,
  };
}

export function useDeclineRequest() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await fetchAPI(`/api/care-sessions/${sessionId}/decline`, {
        method: "POST",
      });
      return res.data;
    },
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: ["caregiver", "requests"] });
      const previousRequests = queryClient.getQueryData<RequestRow[]>([
        "caregiver",
        "requests",
      ]);
      queryClient.setQueryData<RequestRow[]>(["caregiver", "requests"], (old) =>
        (old ?? []).filter((request) => request.id !== sessionId),
      );
      return { previousRequests };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caregiver", "requests"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["caregiver", "requests"] });
      Alert.alert("Could not decline booking", "Please try again.");
    },
  });

  return {
    declineRequest: mutation.mutate,
    isDeclining: mutation.isPending,
  };
}
