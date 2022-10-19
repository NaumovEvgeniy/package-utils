export const Task = <R, T = void>(name: string, task: (data: T) => Promise<R>) => {
	return async (data: T) => {
		console.group(`Task: ${name} >>`)
		console.log('Arguments')
		console.log(data)
		console.time(name)
		let result: R;
		let lastError: any | undefined;
		try {
			result = await task(data);
			console.log('>> Finished')
		} catch (e) {
			lastError = e;
			console.log('!! Errored')
		}
		console.timeEnd(name)
		console.groupEnd();
		console.log()
		if(lastError){
			throw lastError;
		}else{
			return result!;
		}
	};
}
