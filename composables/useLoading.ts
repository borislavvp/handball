export const useLoading = () => {
    const loading = useState<boolean>('app_loading', () => true);
    const fetching = useState<boolean>('store_fetching', () => true);
    
    return { loading, fetching };
}

export type LoadingState = ReturnType<typeof useLoading>;