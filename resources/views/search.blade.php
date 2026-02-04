<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Open Source Search</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">
    <div class="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 class="text-2xl font-bold text-gray-800 mb-2 text-center">Open Source Search</h1>
        <p class="text-gray-500 text-sm text-center mb-6">Enter a person's name and location to generate a risk report.</p>

        @if(session('error'))
            <div class="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                {{ session('error') }}
            </div>
        @endif

        <form id="searchForm">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">

            <div class="mb-4">
                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" name="name" id="name" value="{{ old('name') }}"
                       class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="e.g. John Smith" required>
                @error('name')
                    <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                @enderror
            </div>

            <div class="mb-4">
                <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" name="city" id="city" value="{{ old('city') }}"
                       class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="e.g. Tampa" required>
                @error('city')
                    <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                @enderror
            </div>

            <div class="mb-6">
                <label for="state" class="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" name="state" id="state" value="{{ old('state') }}"
                       class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="e.g. Florida" required>
                @error('state')
                    <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                @enderror
            </div>

            <button type="submit" id="submitBtn"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200">
                Generate Report
            </button>

            <button type="button" id="clearBtn"
                    class="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md transition duration-200">
                Clear Fields
            </button>

            <div id="loadingState" class="hidden text-center mt-4">
                <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="text-gray-600 text-sm font-medium">Processing your search...</p>
                <p class="text-gray-400 text-xs mt-1">This may take 30–60 seconds. Please do not close this page.</p>
            </div>

            <div id="successState" class="hidden bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded mt-4 text-sm"></div>

            <div id="errorState" class="hidden bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mt-4 text-sm"></div>
        </form>
    </div>

    <script>
        function clearForm() {
            document.getElementById('name').value = '';
            document.getElementById('city').value = '';
            document.getElementById('state').value = '';
            document.getElementById('successState').classList.add('hidden');
            document.getElementById('errorState').classList.add('hidden');
        }

        document.getElementById('clearBtn').addEventListener('click', clearForm);

        document.getElementById('searchForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            var submitBtn = document.getElementById('submitBtn');
            var clearBtn = document.getElementById('clearBtn');
            var loadingState = document.getElementById('loadingState');
            var successState = document.getElementById('successState');
            var errorState = document.getElementById('errorState');

            submitBtn.classList.add('hidden');
            clearBtn.classList.add('hidden');
            loadingState.classList.remove('hidden');
            successState.classList.add('hidden');
            errorState.classList.add('hidden');

            try {
                var formData = new FormData(this);
                var response = await fetch('{{ route("search.run") }}', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    var errData = await response.json().catch(function() { return {}; });
                    throw new Error(errData.error || 'Server returned an error. Please try again.');
                }

                var blob = await response.blob();
                var disposition = response.headers.get('Content-Disposition') || '';
                var match = disposition.match(/filename="?([^"]+)"?/);
                var filename = match ? match[1] : 'due-diligence-report.pdf';

                var url = window.URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);

                // Show success banner and clear fields
                successState.textContent = 'Report generated successfully! Your PDF has been downloaded.';
                successState.classList.remove('hidden');
                clearForm();
                successState.classList.remove('hidden');
                setTimeout(function() { successState.classList.add('hidden'); }, 5000);
            } catch (err) {
                errorState.textContent = err.message;
                errorState.classList.remove('hidden');
            } finally {
                submitBtn.classList.remove('hidden');
                clearBtn.classList.remove('hidden');
                loadingState.classList.add('hidden');
            }
        });
    </script>
</body>
</html>
