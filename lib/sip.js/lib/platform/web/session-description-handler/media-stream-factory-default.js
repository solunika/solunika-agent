/**
 * Function which returns a MediaStreamFactory.
 * @public
*/
// import { MediaStream, getUserMedia } = require('@roamhq/wrtc');
import { MediaStream } from '@roamhq/wrtc';

export function defaultMediaStreamFactory() {
    let navigator = new MockNavigator();
    return (constraints) => {
        // if no audio or video, return a media stream without tracks
        if (!constraints.audio && !constraints.video) {
            return Promise.resolve(new MediaStream());
        }
        // getUserMedia() is a powerful feature which can only be used in secure contexts; in insecure contexts,
        // navigator.mediaDevices is undefined, preventing access to getUserMedia(). A secure context is, in short,
        // a page loaded using HTTPS or the file:/// URL scheme, or a page loaded from localhost.
        // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Privacy_and_security
        if (navigator.mediaDevices === undefined) {
            return Promise.reject(new Error("Media devices not available in insecure contexts."));
        }
        return navigator.mediaDevices.getUserMedia.call(navigator.mediaDevices, constraints);
    };
}



class MockMediaDevices {
    getUserMedia(constraints) {
        return new Promise((resolve, reject) => {
            getUserMedia(constraints)
                .then(stream => {
                    console.log('Stream obtained');
                    resolve(stream);
                })
                .catch(error => {
                    console.error('Error obtaining stream:', error);
                    reject(error);
                });
        });
    }
}
//mocked getUserMedia, because roamhq/wrtc does not provide it
function getUserMedia(constraints) {
    return new Promise((resolve, reject) => {
        console.log('getUserMedia called with constraints:', constraints);
        resolve(new MediaStream());
    });    
}



class MockNavigator {
    constructor() {
        this.mediaDevices = new MockMediaDevices();
    }
}