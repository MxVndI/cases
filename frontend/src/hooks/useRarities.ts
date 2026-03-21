import { useQuery } from "@tanstack/react-query";
import { casesApi, type RarityData } from "@/services/api";

export function useRarities(): RarityData[] {
    const { data = [] } = useQuery({
        queryKey: ["rarities"],
        queryFn: casesApi.getRarities,
        staleTime: 300_000,
    });
    return data;
}
