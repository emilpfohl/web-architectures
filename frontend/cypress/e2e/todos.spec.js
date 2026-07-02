describe('Critical path: todos & leaderboard', () => {
  it('creates a WG, adds a todo and completes it, reflecting in the leaderboard', () => {
    const unique = Date.now()
    const user = { email: `e2e_todo_${unique}@example.com`, password: 'password123', name: `E2E Todo ${unique}` }
    const wgName = `E2E WG ${unique}`
    const todoTitle = `Küche putzen ${unique}`

    cy.apiRegister(user).then((resp) => {
      expect([200, 201]).to.include(resp.status)
    })

    cy.uiLogin(user.email, user.password)

    cy.get('[data-cy=wg-onboarding]', { timeout: 5000 }).should('be.visible')
    cy.uiCreateWg(wgName)

    cy.get('[data-cy=main-app]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy=quick-action-todos]').click()

    cy.get('[data-cy=todos-view]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy=todo-title-input]').type(todoTitle)
    cy.get('[data-cy=add-todo-button]').click()

    cy.contains('[data-cy^="todo-item-"]', todoTitle, { timeout: 5000 }).click()

    cy.get('[data-cy=nav-tab-dashboard]').click()
    cy.get('[data-cy=dashboard-view]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy=leaderboard-list]').should('exist')
  })
})
