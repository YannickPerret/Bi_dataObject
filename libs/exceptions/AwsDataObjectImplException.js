// create class exception
class AwsDataObjectImplException extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class ObjectAlreadyExistException extends AwsDataObjectImplException {
    constructor(message) {
        super(message);
    }
}

class ObjectNotFoundException extends AwsDataObjectImplException {
    constructor(message) {
        super(message);
    }
}

class NotEmptyObjectException extends AwsDataObjectImplException {
    constructor(message) {
        super(message);
    }
}


module.exports = {
    ObjectAlreadyExistException,
    ObjectNotFoundException,
    NotEmptyObjectException
}