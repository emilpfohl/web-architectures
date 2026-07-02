describe('Critical path: shopping list', () => {
  it('creates a WG and adds an item to the shopping list', () => {
    const unique = Date.now()
    const user = { email: `e2e_shop_${unique}@example.com`, password: 'password123', name: `E2E Shop ${unique}` }
    const wgName = `E2E WG ${unique}`
    const itemName = `Milch ${unique}`

    cy.apiRegister(user).its('status').should('be.oneOf', [200, 201])
    cy.uiLogin(user.email, user.password)

    cy.get('[data-cy=wg-onboarding]', { timeout: 5000 }).should('be.visible')
    cy.uiCreateWg(wgName)

    cy.get('[data-cy=main-app]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy=quick-action-shopping]').click()

    cy.get('[data-cy=shopping-view]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy="add-item-toggle-Lebensmittel"]').click()
    cy.get('[data-cy="new-item-input-Lebensmittel"]').type(itemName)
    cy.get('[data-cy="new-item-submit-Lebensmittel"]').click()

    cy.get('[data-cy=shopping-category-Lebensmittel]', { timeout: 5000 })
      .should('contain.text', itemName)
  })
})
