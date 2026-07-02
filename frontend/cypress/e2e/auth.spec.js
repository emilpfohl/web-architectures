describe('Auth flow', () => {
  it('registers a new user via API and logs in via UI', () => {
    const unique = Date.now()
    const user = { email: `e2e_${unique}@example.com`, password: 'password123', name: `E2E User ${unique}` }

    // create user via API
    cy.apiRegister(user).then((resp) => {
      expect([200, 201]).to.include(resp.status)
    })

    // login via UI
    cy.uiLogin(user.email, user.password)

    // a freshly registered user has no WG yet, so they land on the onboarding screen
    cy.get('[data-cy=wg-onboarding]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy=create-wg-toggle]').should('be.visible')
  })
})
