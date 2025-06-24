/// <reference types="cypress" />

function getToneNodes() {
  return cy.window().its('__toneNodes__');
}

describe('Interactive Music 3D', () => {
  before(() => {
    cy.on('uncaught:exception', (err) => {
      // prevent Cypress from failing the test
      console.error('Uncaught error', err);
      return false;
    });
  });

  it('spawns object and tweaks effects', () => {
    cy.visit('/');

    // ensure + button visible bottom-left
    cy.get('button').contains('+').should('be.visible');

    // click + to spawn sphere
    cy.get('button').contains('+').click();

    // assert new object added via store
    cy.window()
      .its('__objects__')
      .should('have.length.at.least', 1);

    // open EffectsPanel by clicking sphere
    cy.get('canvas').click('center');

    cy.contains('Chorus Depth').should('exist');
    cy.contains('Reverb Wet').should('exist');
    cy.contains('Delay Feedback').should('exist');
    cy.contains('Bit Depth').should('exist');

    cy.contains('Chorus Depth').parent().within(() => {
      cy.get('input').invoke('val').then((val) => {
        expect(parseFloat(val)).to.equal(0.7);
      });
    });

    // adjust chorus knob
    cy.contains('Chorus Depth').parent().find('input').invoke('val', 0.3).trigger('input');

    // verify Tone node changed
    getToneNodes().its('chorus').its('depth').should('equal', 0.3);
  });
});
