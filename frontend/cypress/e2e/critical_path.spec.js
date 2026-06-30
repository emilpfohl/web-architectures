describe('Critical path: shopping, todos, leaderboard', () => {
  it('creates shopping item and todo, completes todo, leaderboard updates', () => {
    const unique = Date.now()
    const user = { email: `e2e_${unique}@example.com`, password: 'password123', name: `E2E User ${unique}` }
    const shoppingItem = `Milch ${unique}`
    const todoTitle = `Abwasch ${unique}`

    // register user via API
    cy.apiRegister(user).its('status').should('be.oneOf', [200,201])

    // login via UI
    cy.uiLogin(user.email, user.password)

    // ensure dashboard present
    cy.contains('WG Stimmung', { timeout: 5000 }).should('be.visible')

    // Navigate to shopping via quick action
    cy.contains('Einkaufen').click()
    cy.contains('Einkaufen?', { timeout: 3000 }).should('be.visible')

    // Add item to Lebensmittel
    cy.contains('Lebensmittel')
      .parents('section')
      .within(() => {
        cy.contains('Eintrag hinzufügen').click()
        cy.get('input[placeholder^="Lebensmittel"]').type(shoppingItem)
        cy.get('form').within(() => {
          cy.get('button[type="submit"]').click()
        })
      })

    // The item should appear in the list
    cy.contains(shoppingItem, { timeout: 3000 }).should('be.visible')

    // Navigate to todos
    cy.contains('Aufgabe erledigt').click()
    cy.contains('Aufgaben & Rotation', { timeout: 3000 }).should('be.visible')

    // Add a todo
    cy.get('#todo-title-input').type(todoTitle)
    cy.get('#add-todo-btn').click()
    cy.contains(todoTitle, { timeout: 3000 }).should('be.visible')

    // Complete the todo by clicking it
    cy.contains(todoTitle).click()
    // After completing, the card should have reduced opacity (completed class)
    cy.contains(todoTitle).closest('div').should('have.class', 'opacity-30')

    // Return to dashboard and check leaderboard contains user name
    cy.visit('/')
    cy.contains('WG Rangliste', { timeout: 5000 }).should('be.visible')
    cy.contains(user.name, { timeout: 5000 }).should('exist')
  })
})
