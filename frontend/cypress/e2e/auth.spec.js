describe('Auth flow', () => {
  it('registers a new user via API and logs in via UI', () => {
    const unique = Date.now()
    const user = { email: `e2e_${unique}@example.com`, password: 'password123', name: `E2E User ${unique}` }

    // create user via API
    cy.apiRegister(user).then((resp) => {
      expect([200,201]).to.include(resp.status)
    })

    // login via UI
    cy.uiLogin(user.email, user.password)

    // after login we should be redirected to the dashboard
    cy.contains('WG Stimmung', { timeout: 5000 }).should('be.visible')
  })
})
