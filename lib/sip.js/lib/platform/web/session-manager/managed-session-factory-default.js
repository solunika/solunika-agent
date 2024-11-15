/**
 * Function which returns a ManagedSessionFactory.
 * @public
 */
export function defaultManagedSessionFactory() {
    return (sessionManager, session) => {
        return { session, held: false, muted: false };
    };
}
