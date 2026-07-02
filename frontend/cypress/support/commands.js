// Custom commands for E2E tests
Cypress.Commands.add('apiRegister', (user) => {
  return cy.request({
    method: 'POST',
    url: 'http://localhost:3000/api/auth/register',
    body: user,
    failOnStatusCode: false
  })
})

Cypress.Commands.add('uiLogin', (email, password) => {
  cy.visit('/login')
  cy.get('[data-cy=login-email-input]').clear().type(email)
  cy.get('[data-cy=login-password-input]').clear().type(password)
  cy.get('[data-cy=login-submit-button]').click()
})

Cypress.Commands.add('uiCreateWg', (name) => {
  cy.get('[data-cy=create-wg-toggle]').click()
  cy.get('[data-cy=create-wg-name-input]').type(name)
  cy.get('[data-cy=create-wg-submit-button]').click()
})

// eslint-disable-next-line no-undef
module.exports = {}
