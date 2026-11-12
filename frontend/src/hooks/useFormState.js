// The state every form needs: values, field errors and one form-level message,
// plus a helper that puts a server error in the right place.
import { useState } from 'react'
import { getErrorCode, getErrorMessage, getFieldErrors } from '@/lib/errors'
import { focusFirstError } from '@/lib/validation'

export function useFormState(initialValues) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setFormError(null)
  }

  // the props a FormField needs for one text field
  function field(name) {
    return {
      id: name,
      value: values[name],
      onChange: (e) => setField(name, e.target.value),
      error: errors[name],
    }
  }

  function showErrors(found) {
    setErrors(found)
    focusFirstError(found)
  }

  // codeToField: e.g. { DUPLICATE_RESOURCE: 'name' } shows that error under the name field
  function applyServerError(error, codeToField = {}) {
    const target = codeToField[getErrorCode(error)]
    const fieldErrors = getFieldErrors(error)
    if (target) showErrors({ [target]: getErrorMessage(error) })
    else if (Object.keys(fieldErrors).length) showErrors(fieldErrors)
    else setFormError(getErrorMessage(error))
  }

  return {
    values,
    setValues,
    setField,
    field,
    errors,
    showErrors,
    formError,
    setFormError,
    applyServerError,
  }
}
