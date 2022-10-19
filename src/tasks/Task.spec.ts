import {Task} from "~/tasks/Task";
import {expect} from "chai";

describe('Task', () => {

	describe('Should call', () => {
		const cases = [
			{name: 'With error', error: true},
			{name: 'Successfully', error: false},
		];

		cases.forEach(p => {
			it(p.name, async () => {

				const successValue = Math.random();
				const innerTask = async () => {
					if(p.error){
						throw 'some error'
					}

					return successValue;
				};

				try {
					const result = await Task('Name', innerTask)()
					expect(result).to.be.eq(successValue)
				} catch (e) {
					expect(true).to.be.eq(p.error)
				}
			})
		})
	})
})
