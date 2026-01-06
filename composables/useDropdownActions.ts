export const useDropdownActions = () => {
  const loadingAction = useState<string | null>('dropdown-loading', () => null)

  const start = (id: string) => {
    loadingAction.value = id
  }

  const stop = () => {
    loadingAction.value = null
  }

  const isLoading = (id: string) => loadingAction.value === id

  return { loadingAction, start, stop, isLoading }
}
export type DropdownActionsState = ReturnType<typeof useDropdownActions>;