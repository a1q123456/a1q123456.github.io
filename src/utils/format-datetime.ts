
export const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
}
