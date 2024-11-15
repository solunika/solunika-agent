import { UserAgent, Inviter, SessionState, RegistererState, Web, Invitation } from 'sip.js';

// const simpleUserDelegate: Web.SimpleUserDelegate = {
// 	onInvite: (invitation: Invitation) => {
// 		invitation.accept();
// 	}
// };



class SIPLLMConnector {
	constructor({ userId, registerURL, authPass, displayName, domain, viaHost, contactName }) {
		this.userAgent = null;
		this.userId = userId;
		this.registerURL = registerURL;
		this.authPass = authPass;
		this.displayName = displayName;
		this.domain = domain;
		this.viaHost = viaHost;
		this.contactName = contactName;

	}

	async init() {
		try {
			console.log('Starting SIP client');

			if (typeof WebSocket === 'undefined') {
				console.error('WebSocket is not available in this environment');
				return;
			}

			this.userAgent = new UserAgent({
				uri: UserAgent.makeURI(`sip:${this.userId}@${this.domain}`),
				viaHost: this.viaHost,
				transportOptions: {
					server: this.registerURL,
					traceSip: true,					
				},
				authorizationUsername: this.userId,
				authorizationPassword: this.authPass,
				displayName: this.displayName,
				register: true,
				registerExpires: 600,
				logLevel: 3,
				traceSip: true,				
				contactName: this.contactName,
			});

			await this.userAgent.start();			
			console.log("User Agent started");
			this.setupUserAgentListeners();
		} catch (error) {
			console.error('Failed to initialize SIP client:', error);
		}
	}

	setupUserAgentListeners() {

		const target = UserAgent.makeURI(`sip:${this.userId}@${this.domain}`);
		if (!target) {
			throw new Error("Failed to create target URI.");
		}

		const inviter = new Inviter(this.userAgent, target, {
			sessionDescriptionHandlerOptions: {
				constraints: { audio: true, video: false },
			}
		});

		// Handle outgoing session state changes
		inviter.stateChange.addListener((newState) => {
			switch (newState) {
				case SessionState.Establishing:
					console.log('Session establishing');
					break;
				case SessionState.Established:
					console.log('Session established');
					break;
				case SessionState.Terminated:
					console.log('Session terminated');
					break;
				default:
					break;
			}
		});

		// Send initial INVITE request
		inviter.invite()
			.then(() => {
				console.log('INVITE request sent');				
			})
			.catch((error) => {
				console.error('Failed to send INVITE request:', error);
			}
		);


		
	}

	handleIncomingCall(invitation) {
		invitation.accept().then(() => {
			console.log('Call accepted');
			invitation.stateChange.addListener((newState) => {
				switch (newState) {
					case SessionState.Established:
						console.log('Call established');
						break;
					case SessionState.Terminated:
						console.log('Call terminated');
						break;
					default:
						break;
				}
			});
		});
	}
}

export default SIPLLMConnector;