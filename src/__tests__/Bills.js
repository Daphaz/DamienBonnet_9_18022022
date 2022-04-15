/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import BillsUI from '../views/BillsUI.js'
import { bills } from '../fixtures/bills.js'
import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import mockStore from '../__mocks__/store.js'
import store from '../app/Store.js'

import router from '../app/Router.js'
import Bills, { antiChrono } from '../containers/Bills.js'

describe('Given I am connected as an employee', () => {
	describe('When I am on Bills Page', () => {
		test('Then bill icon in vertical layout should be highlighted', async () => {
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
			window.onNavigate(ROUTES_PATH.Bills)
			await waitFor(() => screen.getByTestId('icon-window'))
			const windowIcon = screen.getByTestId('icon-window')
			//to-do write expect expression
			expect(windowIcon.classList.contains('active-icon')).toBe(true)
		})
		test('Then bills should be ordered from earliest to latest', () => {
			document.body.innerHTML = BillsUI({ data: bills })
			const dates = screen
				.getAllByText(
					/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
				)
				.map((a) => a.innerHTML)

			const datesSorted = [...dates].sort(antiChrono)
			expect(dates).toStrictEqual(datesSorted)
		})
	})
	describe('When I am on Bills page but it is loading', () => {
		test('Then, Loading page should be rendered', () => {
			document.body.innerHTML = BillsUI({ loading: true })
			expect(screen.getAllByText('Loading...')).toBeTruthy()
		})
	})
	describe('When I am on Bills page but back-end send an error message', () => {
		test('Then, Error page should be rendered', () => {
			document.body.innerHTML = BillsUI({ error: 'some error message' })
			expect(screen.getAllByText('Erreur')).toBeTruthy()
		})
	})

	describe('When I click on button new bill', () => {
		test('Then i should go in new bill page', () => {
			let path
			const onNavigate = (pathname) => {
				path = pathname
				document.body.innerHTML = ROUTES({ pathname })
			}
			document.body.innerHTML = BillsUI({ data: bills })
			const container = new Bills({
				document,
				onNavigate,
				store,
				localStorage: window.localStorage,
			})

			const handlerClick = jest.fn(container.handleClickNewBill)
			const button = screen.getByTestId('btn-new-bill')

			button.addEventListener('click', handlerClick)

			userEvent.click(button)
			expect(handlerClick).toHaveBeenCalled()
			expect(path).toStrictEqual(ROUTES_PATH.NewBill)
		})
	})
	describe('When i click on icon eye', () => {
		test('Then it should open the bill modal with the bill url expected', () => {
			$.fn.modal = jest.fn()
			document.body.innerHTML = BillsUI({ data: bills })
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname })
			}
			new Bills({
				document,
				onNavigate,
				store,
				localStorage: window.localStorage,
			})

			const iconsEye = screen.getAllByTestId('icon-eye')

			iconsEye.forEach((iconEye) => {
				userEvent.click(iconEye)
				const modal = screen.getByTestId('modal-file')
				const billUrl = iconEye.getAttribute('data-bill-url').split('?')[0]
				expect(modal.innerHTML.includes(billUrl)).toBeTruthy()
				expect(modal).toBeTruthy()
				expect($.fn.modal).toHaveBeenCalled()
			})
		})
	})
})

// test d'intégration GET
describe('Given I am a user connected as Employee', () => {
	describe('When I navigate to Bills', () => {
		test('fetches bills from mock API GET', async () => {
			localStorage.setItem(
				'user',
				JSON.stringify({ type: 'Employee', email: 'a@a' })
			)
			const root = document.createElement('div')
			root.setAttribute('id', 'root')
			document.body.append(root)
			router()
			window.onNavigate(ROUTES_PATH.Bills)
			await waitFor(() => screen.getByText('Mes notes de frais'))
			const tbody = await screen.getByTestId('tbody')
			expect(tbody).toBeTruthy()
		})
		describe('When an error occurs on API', () => {
			beforeEach(() => {
				jest.spyOn(mockStore, 'bills')
				Object.defineProperty(window, 'localStorage', { value: localStorageMock })
				window.localStorage.setItem(
					'user',
					JSON.stringify({
						type: 'Employee',
						email: 'a@a',
					})
				)
				const root = document.createElement('div')
				root.setAttribute('id', 'root')
				document.body.appendChild(root)
				router()
			})
			test('fetches bills from an API and fails with 404 message error', async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error('Erreur 404'))
						},
					}
				})

				document.body.innerHTML = BillsUI({ error: 'Erreur 404' })
				const message = screen.getByText(/Erreur 404/)

				expect(message).toBeTruthy()
			})

			test('fetches messages from an API and fails with 500 message error', async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error('Erreur 500'))
						},
					}
				})

				document.body.innerHTML = BillsUI({ error: 'Erreur 500' })
				const message = screen.getByText(/Erreur 500/)

				expect(message).toBeTruthy()
			})
		})
	})
})
