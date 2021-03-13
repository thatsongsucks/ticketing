import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { Order, OrderStatus } from '../../models/order';
import { natsWrapper } from '../../nats-wrapper';
import mongoose from 'mongoose';


it('changes an order status to cancelled', async () => {

    const ticket = Ticket.build({
        id: mongoose.Types.ObjectId().toHexString(),
        title: 'thing',
        price: 56
    });

    await ticket.save();

    const cookie = global.getCookie();

    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', cookie)
        .send({
            ticketId: ticket.id
        })
        .expect(201);

    await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Cookie', cookie)
        .send()
        .expect(204);

    const updatedOrder = await Order.findById(order.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);

});

it('emits an order cancelled event', async () => {
    const ticket = Ticket.build({
        id: mongoose.Types.ObjectId().toHexString(),
        title: 'thing',
        price: 56
    });

    await ticket.save();

    const cookie = global.getCookie();

    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', cookie)
        .send({
            ticketId: ticket.id
        })
        .expect(201);

    await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Cookie', cookie)
        .send()
        .expect(204);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
});