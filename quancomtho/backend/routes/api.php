<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DishController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\PaymentController;

Route::get('/health', fn() => response()->json(['status' => 'ok']));

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
    Route::get('/tables', [TableController::class, 'index']);
    Route::put('/tables/{MaBan}/capacity', [TableController::class, 'updateCapacity']);
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    Route::get('/dishes/suspended/list', [DishController::class, 'getSuspended']);
    Route::put('/dishes/bulk-restore', [DishController::class, 'bulkRestore']);
    Route::get('/dishes', [DishController::class, 'index']);
    Route::post('/dishes', [DishController::class, 'store']);
    Route::get('/dishes/{id}', [DishController::class, 'show']);
    Route::put('/dishes/{id}', [DishController::class, 'update']); // Use POST with _method=PUT from React to handle files
    Route::delete('/dishes/{id}', [DishController::class, 'destroy']);
    Route::put('/dishes/{id}/restore', [DishController::class, 'restore']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders/takeaway', [OrderController::class, 'storeTakeaway']); // Quick fallback if needed
    Route::post('/orders/table/{maBan}', [OrderController::class, 'storeTableOrder']); // Quick fallback if needed
    Route::post('/orders/full', [OrderController::class, 'storeFullOrder']);
    Route::post('/orders/qr-mock', [OrderController::class, 'qrOrder']);
    Route::get('/orders/{maDH}', [OrderController::class, 'show']);
    Route::put('/orders/{maDH}/pay', [OrderController::class, 'pay']);
    Route::put('/orders/{maDH}/cancel', [OrderController::class, 'cancel']);
    Route::post('/payment/process', [OrderController::class, 'processPayment']);
});

// Payment gateway routes (outside admin prefix for callbacks)
Route::prefix('payment')->group(function () {
    Route::post('/vnpay/create', [PaymentController::class, 'createVNPay']);
    Route::get('/vnpay/return', [PaymentController::class, 'vnpayReturn']);
    Route::post('/momo/create', [PaymentController::class, 'createMoMo']);
    Route::post('/momo/notify', [PaymentController::class, 'momoNotify']);
});

// Customer public routes (no auth required - for QR ordering)
Route::prefix('customer')->group(function () {
    Route::get('/categories', [CustomerController::class, 'getCategories']);
    Route::get('/dishes', [CustomerController::class, 'getDishes']);
    Route::get('/table/{maBan}', [CustomerController::class, 'getTable']);
    Route::post('/order', [CustomerController::class, 'placeOrder']);
});
