


// windowResizeTracker.js
export const windowResizeTracker = (callback) => {
  const defaultMobileScreenSize = 768;

  const getScreenState = () => ({
    isMobile: window.innerWidth <= defaultMobileScreenSize,
    isDesktop: window.innerWidth > defaultMobileScreenSize,
  });

  // fire once immediately
  callback(getScreenState());

  // listen for resize events
  window.addEventListener("resize", () => {
    callback(getScreenState());
  });
};


export const screenTracker = () => {
    const defaultMobileScreenSize = 768;

    const screenSize = {
        isMobile : window.innerWidth <= defaultMobileScreenSize,
        isDesktop : window.innerWidth > defaultMobileScreenSize
    }
    return screenSize;
}