/*
 * generated by Xtext 2.15.0
 */
package org.pzot.syntax


/**
 * Initialization support for running Xtext languages without Equinox extension registry.
 */
class PZotStandaloneSetup extends PZotStandaloneSetupGenerated {

	def static void doSetup() {
		new PZotStandaloneSetup().createInjectorAndDoEMFRegistration()
	}
}
