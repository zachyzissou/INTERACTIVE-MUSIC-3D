/// <reference types="cypress" />

describe('Interactive Music 3D', () => {
  beforeEach(() => {
    cy.on('window:before:load', (win) => {
      cy.stub(win.console, 'error').as('consoleError')
    })
    cy.visit('/')
  })

  it('spawns sphere and edits effects', () => {
    cy.get('[data-cy=add-button]').should('be.visible')

    cy.window().then((win) => {
      const count = win.__useShapesStore.getState().shapes.length
      expect(count).to.eq(0)
    })

    cy.get('[data-cy=add-button]').click()

    cy.window().then((win) => {
      const count = win.__useShapesStore.getState().shapes.length
      expect(count).to.eq(1)
    })

    cy.get('[data-cy^=shape-]').first().click()
    cy.get('.effects-panel').should('be.visible')

    cy.window().then((win) => {
      const { chorus, delay, reverb, bitcrusher } = win.__toneNodes__ || {}
      expect(chorus.depth).to.equal(0.7)
      expect(reverb.wet.value).to.equal(0.5)
      expect(delay.feedback.value).to.equal(0.4)
      expect(bitcrusher.bits).to.equal(4)
    })

    cy.get('[aria-label="Chorus Depth"]').trigger('pointerdown', { clientX: 0, clientY: 0 })
      .trigger('pointermove', { clientX: 0, clientY: -30 })
      .trigger('pointerup', { force: true })

    cy.window().then((win) => {
      const { chorus } = win.__toneNodes__ || {}
      expect(chorus.depth).to.not.equal(0.7)
    })

    cy.get('@consoleError').should('not.be.called')
  })
})
