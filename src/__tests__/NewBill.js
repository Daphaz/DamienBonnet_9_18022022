/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import store from '../__mocks__/store.js'
import router from '../app/Router.js'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'

describe('Given I am connected as an employee', () => {
	describe('When I am on NewBill Page', () => {
		test('Then new bill icon in vertical layout should be highlighted', async () => {
			Object.defineProperty(window, 'localStorage', { value: localStorageMock })
			window.localStorage.setItem(
				'user',
				JSON.stringify({
					type: 'Employee',
				})
			)
			const root = document.createElement('div')
			root.setAttribute('id', 'root')
			document.body.append(root)
			router()
			window.onNavigate(ROUTES_PATH.NewBill)
			await waitFor(() => screen.getByTestId('icon-mail'))
			const emailIcon = screen.getByTestId('icon-mail')

			expect(emailIcon.classList.contains('active-icon')).toBe(true)
		})

		describe('When i select file by the file input', () => {
			document.body.innerHTML = NewBillUI()
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname })
			}
			const fileInput = document.querySelector(`input[data-testid="file"]`)
			const container = new NewBill({
				document,
				onNavigate,
				store,
				localStorage: window.localStorage,
			})
			const fileChange = jest.fn(container.handleChangeFile)

			fileInput.addEventListener('change', fileChange)

			describe('When the file is a jp(e)g or png image', () => {
				test('Then the file should be uploaded without any error message', () => {
					const file = new File(['test.png'], 'test.png', { type: 'image/png' })
					fileInput.classList.add('file-invalid')
					userEvent.upload(fileInput, file)

					expect(fileChange).toHaveBeenCalled()
					expect(fileInput.files[0]).toStrictEqual(file)
					expect(fileInput.files.item(0)).toStrictEqual(file)
					expect(fileInput.files).toHaveLength(1)
					expect(fileInput.classList.contains('file-invalid')).toBeFalsy()
				})
			})

			describe('When the file is not a jpg or png image', () => {
				test('Then the file should not be uploaded and display error message', () => {
					const file = new File(['test.webp'], 'test.webp', { type: 'image/webp' })
					userEvent.upload(fileInput, file)

					expect(fileChange).toHaveBeenCalled()
					expect(fileInput.files[0]).toStrictEqual(file)
					expect(fileInput.files.item(0)).toStrictEqual(file)
					expect(fileInput.files).toHaveLength(1)
					expect(fileInput.classList.contains('file-invalid')).toBeTruthy()
				})
			})
		})

		describe('When i submit new bill form', () => {
			test('Then handleSubmit() should be call', () => {
				Object.defineProperty(window, 'localStorage', { value: localStorageMock })
				window.localStorage.setItem(
					'user',
					JSON.stringify({
						type: 'Employee',
					})
				)
				document.body.innerHTML = NewBillUI()
				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname })
				}
				const container = new NewBill({
					document,
					onNavigate,
					store,
					localStorage: window.localStorage,
				})

				const form = document.querySelector(`form[data-testid="form-new-bill"]`)
				const handleSubmitSpy = jest.spyOn(container, 'handleSubmit')
				form.addEventListener('submit', handleSubmitSpy)
				fireEvent.submit(form)
				expect(handleSubmitSpy).toHaveBeenCalled()
			})
		})
	})
})
