/**
 * Обгортає проміс тайм-аутом.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(errorMsg));
        }, ms);
    });

    return Promise.race([
        promise.then((res) => {
            clearTimeout(timer);
            return res;
        }),
        timeoutPromise
    ]);
}