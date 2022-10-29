export default function (fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
// it will catch error in async block in the controllers or wherever it will be wrapped.....
